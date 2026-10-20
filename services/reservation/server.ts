import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { DataSourceLabel, SeatAvailabilityResult, FareCalculationResult, PnrStatusResult, ConfirmationPredictionResult, RefundEstimationResult } from '../../shared/types.js';
import { ServiceHealthRepository } from '../../data/db/index.js';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.RESERVATION_SERVICE_PORT || '4003', 10);
const SERVICE_ID = 'reservation';

app.use(cors());
app.use(express.json());

const startTime = Date.now();
let requestCount = 0;

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
  const trainNumber = (req.query.train as string) || '12951';
  const from = ((req.query.from as string) || 'MMCT').toUpperCase();
  const to = ((req.query.to as string) || 'NDLS').toUpperCase();
  const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
  const classType = ((req.query.class as string) || '3A').toUpperCase();
  const quota = ((req.query.quota as string) || 'GN').toUpperCase();

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
      source: 'SIMULATED_DEMO_DATA' as DataSourceLabel,
      endpointId: 'SEAT_AVAILABILITY'
    }
  });
});

// 2. Fare Calculator (GET /v1/reservation/fare?train=...&from=...&to=...&distance=...)
app.get('/reservation/fare', (req, res) => {
  const trainNumber = (req.query.train as string) || '12951';
  const from = ((req.query.from as string) || 'MMCT').toUpperCase();
  const to = ((req.query.to as string) || 'NDLS').toUpperCase();

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
      source: 'SIMULATED_DEMO_DATA' as DataSourceLabel,
      endpointId: 'FARE_CALCULATOR'
    }
  });
});

// 3. PNR Status (GET /v1/pnr/:pnr)
// Strict rule: NEVER log PNR, mask digits in logs
app.get('/pnr/:pnr', (req, res) => {
  const pnr = req.params.pnr.replace(/\D/g, ''); // Digits only

  if (pnr.length !== 10) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_PNR_FORMAT', message: 'PNR must be a 10-digit numerical identifier' },
      meta: { traceId: `err-${Date.now()}`, timestamp: new Date().toISOString(), executionTimeMs: 1, source: 'UNAVAILABLE' as DataSourceLabel }
    });
  }

  // Look up in mock reservations fixture
  const record = reservationsData.pnrs[pnr];
  if (record) {
    return res.json({
      success: true,
      data: record,
      meta: {
        traceId: `pnr-${Date.now()}`,
        timestamp: new Date().toISOString(),
        executionTimeMs: 2,
        source: 'SIMULATED_DEMO_DATA' as DataSourceLabel,
        endpointId: 'PNR_STATUS'
      }
    });
  }

  // Generate deterministic synthetic PNR result for arbitrary 10 digits
  const lastDigit = parseInt(pnr.slice(-1), 10);
  const syntheticResult: PnrStatusResult = {
    pnr: `${pnr.slice(0, 3)}-${pnr.slice(3)}`,
    trainNumber: '12951',
    trainName: 'Mumbai Tejas Rajdhani',
    journeyDate: '2026-10-26',
    fromStation: 'MMCT',
    toStation: 'NDLS',
    boardingStation: 'MMCT',
    classType: '3A',
    chartStatus: lastDigit % 2 === 0 ? 'CHART PREPARED' : 'CHART NOT PREPARED',
    passengers: [
      {
        passengerIndex: 1,
        bookingStatus: lastDigit > 5 ? 'RAC 2' : 'CNF B3 42',
        currentStatus: lastDigit > 5 ? 'CNF B3 55' : 'CNF B3 42',
        confirmationChancePercent: 100
      }
    ]
  };

  res.json({
    success: true,
    data: syntheticResult,
    meta: {
      traceId: `pnr-${Date.now()}`,
      timestamp: new Date().toISOString(),
      executionTimeMs: 2,
      source: 'SIMULATED_DEMO_DATA' as DataSourceLabel,
      endpointId: 'PNR_STATUS'
    }
  });
});

// 4. Confirmation Prediction (GET /v1/pnr/prediction?train=...&class=...&waitlistNumber=...&date=...)
app.get('/pnr/prediction', (req, res) => {
  const trainNumber = (req.query.train as string) || '12951';
  const classType = ((req.query.class as string) || '3A').toUpperCase();
  const waitlistNumber = parseInt((req.query.waitlistNumber as string) || '15', 10);
  const journeyDate = (req.query.date as string) || new Date().toISOString().split('T')[0];

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
      source: 'SIMULATED_DEMO_DATA' as DataSourceLabel,
      endpointId: 'CONFIRMATION_PREDICTION'
    }
  });
});

// 5. Cancellation Refund Rules (GET /v1/reservation/refund-rules?ticketAmount=...&class=...&hoursBeforeDeparture=...&status=...)
app.get('/reservation/refund-rules', (req, res) => {
  const ticketAmount = parseFloat((req.query.ticketAmount as string) || '1890');
  const classType = ((req.query.class as string) || '3A').toUpperCase();
  const hours = parseFloat((req.query.hoursBeforeDeparture as string) || '52');
  const status = ((req.query.status as string) || 'CONFIRMED').toUpperCase() as 'CONFIRMED' | 'RAC' | 'WAITLIST';

  let clerkageOrFee = 0;
  let ruleText = '';

  if (status === 'WAITLIST' || status === 'RAC') {
    clerkageOrFee = 60;
    ruleText = 'Waitlisted/RAC ticket cancelled: Flat clerkage charge of ₹60 per passenger deducted.';
  } else {
    // Confirmed tickets
    const flatCharges: Record<string, number> = { '1A': 240, '2A': 200, '3A': 180, 'CC': 180, 'EC': 200, 'SL': 120 };
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
      source: 'SIMULATED_DEMO_DATA' as DataSourceLabel,
      endpointId: 'CANCELLATION_REFUND'
    }
  });
});

app.listen(PORT, () => {
  console.log(`[Service: Reservation Intelligence] running on port ${PORT}`);
});
