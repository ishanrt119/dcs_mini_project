import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { DataSourceLabel, SeatAvailabilityResult, FareCalculationResult, PnrStatusResult, ConfirmationPredictionResult, RefundEstimationResult } from '../../shared/types.js';
import { ServiceHealthRepository } from '../../data/db/index.js';
import { DemoRailwayAdapter } from '../../shared/demo-railway-adapter.js';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.RESERVATION_SERVICE_PORT || '4003', 10);
const SERVICE_ID = 'reservation';

app.use(cors());
app.use(express.json());

const startTime = Date.now();
let requestCount = 0;
const demoAdapter = DemoRailwayAdapter.getInstance();

// Load fixtures
const reservationsData: any = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'data/fixtures/reservations.json'), 'utf-8'));
const trainsData: any[] = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'data/fixtures/trains.json'), 'utf-8'));

// Outage middleware
app.use((req, res, next) => {
  requestCount++;
  if (ServiceHealthRepository.isSimulatedFailure(SERVICE_ID) && !req.path.startsWith('/admin') && req.path !== '/health') {
    return res.status(503).json({
      success: false,
      error: {
        code: 'SERVICE_OUTAGE_SIMULATED',
        message: 'Reservation Intelligence Service is temporarily offline (Simulated 503 Fault Injection)'
      },
      meta: {
        traceId: `err-${Date.now()}`,
        timestamp: new Date().toISOString(),
        executionTimeMs: 1,
        source: 'UNAVAILABLE' as DataSourceLabel
      }
    });
  }
  next();
});

// Health endpoint
app.get('/health', (req, res) => {
  const isFailed = ServiceHealthRepository.isSimulatedFailure(SERVICE_ID);
  res.status(isFailed ? 503 : 200).json({
    serviceId: SERVICE_ID,
    name: 'Reservation Intelligence Service',
    port: PORT,
    status: isFailed ? 'DEGRADED' : 'UP',
    uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
    requestCount,
    isSimulatedFailure: isFailed,
    timestamp: new Date().toISOString()
  });
});

app.post('/admin/simulate-failure', (req, res) => {
  const { fail } = req.body;
  ServiceHealthRepository.setSimulatedFailure(SERVICE_ID, !!fail);
  res.json({ success: true, serviceId: SERVICE_ID, simulatedFailure: !!fail });
});

// 1. Seat Availability (GET /v1/reservation/availability?train=...&from=...&to=...&date=...&class=...&quota=...)
app.get('/reservation/availability', (req, res) => {
  const trainNumber = ((req.query.train as string) || '12951').trim();
  const from = ((req.query.from as string) || 'MMCT').toUpperCase().trim();
  const to = ((req.query.to as string) || 'NDLS').toUpperCase().trim();
  const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
  const classType = ((req.query.class as string) || '3A').toUpperCase().trim();
  const quota = ((req.query.quota as string) || 'GN').toUpperCase().trim();

  if (!trainNumber || from === to) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_AVAILABILITY_QUERY', message: 'Origin and destination must be distinct stations' },
      meta: { traceId: `err-${Date.now()}`, timestamp: new Date().toISOString(), executionTimeMs: 1, source: 'UNAVAILABLE' as DataSourceLabel }
    });
  }

  // Generate deterministic 6-day availability matrix
  const baseDate = new Date(date);
  const availabilityDays = [];
  const statusOptions = ['AVAILABLE-38', 'AVAILABLE-12', 'RAC 4', 'WL 6', 'WL 19', 'AVAILABLE-54'];

  for (let i = 0; i < 6; i++) {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const status = statusOptions[(i + parseInt(trainNumber.slice(-1) || '0', 10)) % statusOptions.length];
    const isAvailable = status.startsWith('AVAILABLE');
    const isRac = status.startsWith('RAC');

    availabilityDays.push({
      date: dateStr,
      status,
      probability: isAvailable ? 100 : isRac ? 92 : Math.max(30, 85 - i * 10),
      fare: classType === '1A' ? 4450 : classType === '2A' ? 2680 : classType === '3A' ? 1890 : 540
    });
  }

  const result: SeatAvailabilityResult = {
    trainNumber,
    fromStation: from,
    toStation: to,
    date,
    classType,
    quota,
    availability: availabilityDays
  };

  res.json({
    success: true,
    data: result,
    meta: {
      traceId: `avail-${Date.now()}`,
      timestamp: new Date().toISOString(),
      executionTimeMs: 2,
      source: 'LOCAL_JSON_FIXTURE' as DataSourceLabel,
      endpointId: 'SEAT_AVAILABILITY'
    }
  });
});

// 2. Fare Calculator (GET /v1/reservation/fare?train=...&from=...&to=...&distance=...)
app.get('/reservation/fare', (req, res) => {
  const trainNumber = ((req.query.train as string) || '12951').trim();
  const from = ((req.query.from as string) || 'MMCT').toUpperCase().trim();
  const to = ((req.query.to as string) || 'NDLS').toUpperCase().trim();

  // Validate from and to
  if (from === to && from !== '') {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_FARE_QUERY', message: 'Origin and destination station codes must be distinct' },
      meta: { traceId: `err-${Date.now()}`, timestamp: new Date().toISOString(), executionTimeMs: 1, source: 'UNAVAILABLE' as DataSourceLabel }
    });
  }

  // Find approximate distance from train route if available
  const train = trainsData.find(t => t.trainNumber === trainNumber);
  let distanceKm = 1384;
  if (train) {
    const fHalt = train.route.find((h: any) => h.stationCode === from);
    const tHalt = train.route.find((h: any) => h.stationCode === to);
    if (fHalt && tHalt) {
      distanceKm = Math.abs(tHalt.distanceKm - fHalt.distanceKm) || 1384;
    }
  }

  const classes = ['1A', '2A', '3A', 'SL', 'EC', 'CC'];
  const faresByClass: Record<string, any> = {};

  classes.forEach(cls => {
    const rule = reservationsData.fareRules[cls] || reservationsData.fareRules['3A'];
    const baseFare = Math.round(distanceKm * rule.basePerKm);
    const reservationCharge = rule.resCharge;
    const superfastCharge = rule.superfast;
    const subtotal = baseFare + reservationCharge + superfastCharge;
    const gst = Math.round(subtotal * rule.gstRate);
    const totalFare = subtotal + gst;

    faresByClass[cls] = {
      baseFare,
      reservationCharge,
      superfastCharge,
      gst,
      totalFare
    };
  });

  const result: FareCalculationResult = {
    trainNumber,
    fromStation: from,
    toStation: to,
    faresByClass
  };

  res.json({
    success: true,
    data: result,
    meta: {
      traceId: `fare-${Date.now()}`,
      timestamp: new Date().toISOString(),
      executionTimeMs: 2,
      source: 'LOCAL_JSON_FIXTURE' as DataSourceLabel,
      endpointId: 'FARE_CALCULATOR'
    }
  });
});

// 3. PNR Status (GET /v1/pnr/:pnr)
// Strict rule: NEVER log raw PNR, mask digits in logs
app.get('/pnr/:pnr', (req, res) => {
  const rawPnr = req.params.pnr.trim();
  const pnr = rawPnr.replace(/\D/g, ''); // Digits only

  if (pnr.length !== 10) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_PNR_FORMAT', message: 'PNR must be a 10-digit numerical identifier' },
      meta: { traceId: `err-${Date.now()}`, timestamp: new Date().toISOString(), executionTimeMs: 1, source: 'UNAVAILABLE' as DataSourceLabel }
    });
  }

  // Look up in mock reservations fixture or demo adapter
  const record = demoAdapter.getPnrStatus(pnr);
  if (record) {
    return res.json({
      success: true,
      data: record,
      meta: {
        traceId: `pnr-${Date.now()}`,
        timestamp: new Date().toISOString(),
        executionTimeMs: 2,
        source: 'LOCAL_JSON_FIXTURE' as DataSourceLabel,
        endpointId: 'PNR_STATUS'
      }
    });
  }

  return res.status(404).json({
    success: false,
    error: { code: 'PNR_NOT_FOUND', message: 'PNR record not found' },
    meta: { traceId: `err-${Date.now()}`, timestamp: new Date().toISOString(), executionTimeMs: 1, source: 'UNAVAILABLE' as DataSourceLabel }
  });
});

// 4. Confirmation Prediction (GET /v1/pnr/prediction?train=...&class=...&waitlistNumber=...&date=...)
app.get('/pnr/prediction', (req, res) => {
  const trainNumber = (req.query.train as string) || '12951';
  const classType = ((req.query.class as string) || '3A').toUpperCase();
  const waitlistNumber = parseInt((req.query.waitlistNumber as string) || '15', 10);
  const journeyDate = (req.query.date as string) || new Date().toISOString().split('T')[0];

  if (isNaN(waitlistNumber) || waitlistNumber < 0) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_WAITLIST_NUMBER', message: 'Waitlist position must be a non-negative number' },
      meta: { traceId: `err-${Date.now()}`, timestamp: new Date().toISOString(), executionTimeMs: 1, source: 'UNAVAILABLE' as DataSourceLabel }
    });
  }

  // Heuristic probability calculation
  let prob = Math.max(10, Math.min(98, 100 - waitlistNumber * 3.5));
  if (classType === '1A') prob = Math.max(5, prob - 20); // 1A has low cancellation
  if (classType === 'SL') prob = Math.min(95, prob + 10); // SL has high churn

  const trend = prob >= 75 ? 'High Probability' : prob >= 45 ? 'Moderate Probability' : 'Low Probability';

  const result: ConfirmationPredictionResult = {
    pnrOrWaitlist: `WL #${waitlistNumber}`,
    trainNumber,
    classType,
    journeyDate,
    currentWaitlist: waitlistNumber,
    predictedProbabilityPercent: Math.round(prob),
    trend,
    historicalPatternInsight: `Based on historical cancellation trends for ${classType} on ${trainNumber}, waitlists up to #${Math.round(waitlistNumber * 1.3)} have confirmed 82% of the time prior to final charting.`
  };

  res.json({
    success: true,
    data: result,
    meta: {
      traceId: `pred-${Date.now()}`,
      timestamp: new Date().toISOString(),
      executionTimeMs: 2,
      source: 'LOCAL_JSON_FIXTURE' as DataSourceLabel,
      endpointId: 'CONFIRMATION_PREDICTION'
    }
  });
});

// 5. Cancellation Refund Rules (GET /v1/reservation/refund-rules?ticketAmount=...&class=...&hoursBeforeDeparture=...&status=...)
app.get('/reservation/refund-rules', (req, res) => {
  const rawTicketAmount = req.query.ticketAmount as string;
  const rawHours = req.query.hoursBeforeDeparture as string;

  const ticketAmount = parseFloat(rawTicketAmount || '1890');
  const classType = ((req.query.class as string) || '3A').toUpperCase();
  const hours = parseFloat(rawHours || '52');
  const status = ((req.query.status as string) || 'CONFIRMED').toUpperCase() as 'CONFIRMED' | 'RAC' | 'WAITLIST';

  // Validate numeric parameters
  if (isNaN(ticketAmount) || ticketAmount <= 0 || isNaN(hours) || hours < 0) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_REFUND_PARAMETERS', message: 'Ticket amount must be positive and hoursBeforeDeparture must be non-negative.' },
      meta: { traceId: `err-${Date.now()}`, timestamp: new Date().toISOString(), executionTimeMs: 1, source: 'UNAVAILABLE' as DataSourceLabel }
    });
  }

  let clerkageOrFee = 0;
  let ruleText = '';

  if (status === 'WAITLIST' || status === 'RAC') {
    clerkageOrFee = 60;
    ruleText = 'Waitlisted/RAC ticket cancelled: Flat clerkage charge of ₹60 per passenger deducted.';
  } else {
    // Confirmed tickets
    const flatCharges: Record<string, number> = { '1A': 240, '2A': 200, '3A': 180, 'CC': 180, 'EC': 200, 'SL': 120, '2S': 60 };
    const flatFee = flatCharges[classType] || 180;

    if (hours > 48) {
      clerkageOrFee = flatFee;
      ruleText = `More than 48 hours prior to departure: Flat cancellation charge of ₹${flatFee} per passenger.`;
    } else if (hours >= 12 && hours <= 48) {
      clerkageOrFee = Math.max(flatFee, ticketAmount * 0.25);
      ruleText = 'Between 48 hours and 12 hours prior to departure: 25% of ticket fare deducted.';
    } else if (hours >= 4 && hours < 12) {
      clerkageOrFee = Math.max(flatFee, ticketAmount * 0.50);
      ruleText = 'Between 12 hours and 4 hours prior to departure: 50% of ticket fare deducted.';
    } else {
      clerkageOrFee = ticketAmount;
      ruleText = 'Less than 4 hours before scheduled departure or after chart preparation: No refund admissible.';
    }
  }

  const refundAmount = Math.max(0, ticketAmount - clerkageOrFee);

  const result: RefundEstimationResult = {
    ticketAmount,
    cancellationHoursBeforeDeparture: hours,
    classType,
    confirmedOrWaitlist: status,
    clerkageOrCancellationFee: Math.round(clerkageOrFee),
    refundAmount: Math.round(refundAmount),
    applicableRule: ruleText
  };

  res.json({
    success: true,
    data: result,
    meta: {
      traceId: `refund-${Date.now()}`,
      timestamp: new Date().toISOString(),
      executionTimeMs: 1,
      source: 'LOCAL_JSON_FIXTURE' as DataSourceLabel,
      endpointId: 'CANCELLATION_REFUND'
    }
  });
});

app.listen(PORT, () => {
  console.log(`[Service: Reservation Intelligence] running offline on port ${PORT}`);
});
