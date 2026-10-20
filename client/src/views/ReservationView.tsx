import React, { useState } from 'react';
import { Api } from '../api';
import { SourceBadge } from '../components/SourceBadge';
import {
  Ticket,
  Calculator,
  Search,
  Percent,
  Receipt,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight
} from 'lucide-react';

interface Props {
  initialTab?: 'availability' | 'fare' | 'pnr' | 'prediction' | 'refund';
  initialTrainNumber?: string;
  initialFrom?: string;
  initialTo?: string;
}

export const ReservationView: React.FC<Props> = ({
  initialTab = 'availability',
  initialTrainNumber = '12951',
  initialFrom = 'MMCT',
  initialTo = 'NDLS'
}) => {
  const [activeTab, setActiveTab] = useState(initialTab);

  // 1. Availability State
  const [availTrain, setAvailTrain] = useState(initialTrainNumber);
  const [availFrom, setAvailFrom] = useState(initialFrom);
  const [availTo, setAvailTo] = useState(initialTo);
  const [availDate, setAvailDate] = useState(new Date().toISOString().split('T')[0]);
  const [availClass, setAvailClass] = useState('3A');
  const [availQuota, setAvailQuota] = useState('GN');
  const [availResult, setAvailResult] = useState<any>(null);
  const [availLoading, setAvailLoading] = useState(false);

  // 2. Fare State
  const [fareTrain, setFareTrain] = useState(initialTrainNumber);
  const [fareFrom, setFareFrom] = useState(initialFrom);
  const [fareTo, setFareTo] = useState(initialTo);
  const [fareResult, setFareResult] = useState<any>(null);
  const [fareLoading, setFareLoading] = useState(false);

  // 3. PNR State
  const [pnrInput, setPnrInput] = useState('8421928374');
  const [pnrResult, setPnrResult] = useState<any>(null);
  const [pnrLoading, setPnrLoading] = useState(false);
  const [pnrError, setPnrError] = useState<string | null>(null);

  // 4. Prediction State
  const [predTrain, setPredTrain] = useState(initialTrainNumber);
  const [predClass, setPredClass] = useState('3A');
  const [predWl, setPredWl] = useState(14);
  const [predResult, setPredResult] = useState<any>(null);
  const [predLoading, setPredLoading] = useState(false);

  // 5. Refund State
  const [refundAmount, setRefundAmount] = useState(2680);
  const [refundClass, setRefundClass] = useState('2A');
  const [refundHours, setRefundHours] = useState(52);
  const [refundStatus, setRefundStatus] = useState('CONFIRMED');
  const [refundResult, setRefundResult] = useState<any>(null);
  const [refundLoading, setRefundLoading] = useState(false);

  // Handlers
  const handleCheckAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    setAvailLoading(true);
    try {
      const resp = await Api.checkSeatAvailability({
        train: availTrain,
        from: availFrom,
        to: availTo,
        date: availDate,
        class: availClass,
        quota: availQuota
      });
      if (resp.success) setAvailResult(resp.data);
    } catch (e) {
      console.error(e);
    } finally {
      setAvailLoading(false);
    }
  };

  const handleCalculateFare = async (e: React.FormEvent) => {
    e.preventDefault();
    setFareLoading(true);
    try {
      const resp = await Api.calculateFare({ train: fareTrain, from: fareFrom, to: fareTo });
      if (resp.success) setFareResult(resp.data);
    } catch (e) {
      console.error(e);
    } finally {
      setFareLoading(false);
    }
  };

  const handleLookupPnr = async (e: React.FormEvent) => {
    e.preventDefault();
    setPnrLoading(true);
    setPnrError(null);
    try {
      const resp = await Api.getPnrStatus(pnrInput);
      if (resp.success) {
        setPnrResult(resp.data);
      } else {
        setPnrError(resp.error?.message || 'Invalid PNR identifier');
      }
    } catch (err: any) {
      setPnrError(err.message || 'PNR lookup error');
    } finally {
      setPnrLoading(false);
    }
  };

  const handlePredictConfirmation = async (e: React.FormEvent) => {
    e.preventDefault();
    setPredLoading(true);
    try {
      const resp = await Api.getConfirmationPrediction({
        train: predTrain,
        class: predClass,
        waitlistNumber: predWl,
        date: availDate
      });
      if (resp.success) setPredResult(resp.data);
    } catch (e) {
      console.error(e);
    } finally {
      setPredLoading(false);
    }
  };

  const handleCalculateRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    setRefundLoading(true);
    try {
      const resp = await Api.getRefundEstimation({
        ticketAmount: refundAmount,
        class: refundClass,
        hoursBeforeDeparture: refundHours,
        status: refundStatus
      });
      if (resp.success) setRefundResult(resp.data);
    } catch (e) {
      console.error(e);
    } finally {
      setRefundLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Ticket className="w-6 h-6 text-cyan-400" />
            <span>Reservation Intelligence Platform</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Read-only information tools for seat availability, fare calculations, PNR status, and refund estimations.</p>
        </div>
        <SourceBadge source="SIMULATED_DEMO_DATA" />
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3 text-xs">
        <button
          onClick={() => setActiveTab('availability')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === 'availability'
              ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Ticket className="w-4 h-4" />
          <span>Seat Availability</span>
        </button>

        <button
          onClick={() => setActiveTab('fare')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === 'fare'
              ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>Fare Calculator</span>
        </button>

        <button
          onClick={() => setActiveTab('pnr')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === 'pnr'
              ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>PNR Status</span>
        </button>

        <button
          onClick={() => setActiveTab('prediction')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === 'prediction'
              ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Percent className="w-4 h-4" />
          <span>Confirmation Prediction</span>
        </button>

        <button
          onClick={() => setActiveTab('refund')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === 'refund'
              ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Cancellation & Refund</span>
        </button>
      </div>

      {/* TAB 1: SEAT AVAILABILITY */}
      {activeTab === 'availability' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
            <form onSubmit={handleCheckAvailability} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Train</label>
                <input
                  type="text"
                  value={availTrain}
                  onChange={e => setAvailTrain(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">From</label>
                <input
                  type="text"
                  value={availFrom}
                  onChange={e => setAvailFrom(e.target.value.toUpperCase())}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono uppercase focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">To</label>
                <input
                  type="text"
                  value={availTo}
                  onChange={e => setAvailTo(e.target.value.toUpperCase())}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono uppercase focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Class</label>
                <select
                  value={availClass}
                  onChange={e => setAvailClass(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                >
                  <option value="1A">1A (First AC)</option>
                  <option value="2A">2A (Second AC)</option>
                  <option value="3A">3A (Third AC)</option>
                  <option value="SL">SL (Sleeper)</option>
                  <option value="EC">EC (Exec Chair)</option>
                  <option value="CC">CC (AC Chair)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Quota</label>
                <select
                  value={availQuota}
                  onChange={e => setAvailQuota(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                >
                  <option value="GN">General (GN)</option>
                  <option value="TQ">Tatkal (TQ)</option>
                  <option value="LD">Ladies (LD)</option>
                  <option value="SS">Senior Citizen (SS)</option>
                </select>
              </div>
              <div>
                <button
                  type="submit"
                  disabled={availLoading}
                  className="w-full py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium shadow-md shadow-cyan-950"
                >
                  {availLoading ? 'Querying...' : 'Check Availability'}
                </button>
              </div>
            </form>
          </div>

          {availResult && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">
                  Availability Matrix ({availResult.classType} - {availResult.quota} Quota)
                </h3>
                <span className="text-xs text-slate-400">Train #{availResult.trainNumber}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {availResult.availability.map((day: any, idx: number) => {
                  const isAvailable = day.status.startsWith('AVAILABLE');
                  const isRac = day.status.startsWith('RAC');
                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border text-center transition-all ${
                        isAvailable
                          ? 'bg-emerald-950/30 border-emerald-800/60'
                          : isRac
                          ? 'bg-cyan-950/30 border-cyan-800/60'
                          : 'bg-amber-950/30 border-amber-800/60'
                      }`}
                    >
                      <div className="text-[11px] text-slate-400 font-mono">
                        {new Date(day.date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </div>
                      <div
                        className={`text-sm font-bold font-mono my-2 ${
                          isAvailable ? 'text-emerald-400' : isRac ? 'text-cyan-400' : 'text-amber-400'
                        }`}
                      >
                        {day.status}
                      </div>
                      <div className="text-[11px] text-slate-300 font-mono">₹{day.fare}</div>
                      <div className="text-[10px] text-slate-500 mt-1">Odds: {day.probability}%</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: FARE CALCULATOR */}
      {activeTab === 'fare' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
            <form onSubmit={handleCalculateFare} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Train</label>
                <input
                  type="text"
                  value={fareTrain}
                  onChange={e => setFareTrain(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">From Code</label>
                <input
                  type="text"
                  value={fareFrom}
                  onChange={e => setFareFrom(e.target.value.toUpperCase())}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono uppercase focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">To Code</label>
                <input
                  type="text"
                  value={fareTo}
                  onChange={e => setFareTo(e.target.value.toUpperCase())}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono uppercase focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div>
                <button
                  type="submit"
                  disabled={fareLoading}
                  className="w-full py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium shadow-md shadow-cyan-950"
                >
                  {fareLoading ? 'Calculating...' : 'Compute Fares'}
                </button>
              </div>
            </form>
          </div>

          {fareResult && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-white">
                Telescopic Fare Matrix ({fareResult.fromStation} → {fareResult.toStation})
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                      <th className="pb-3 font-semibold">Travel Class</th>
                      <th className="pb-3 font-semibold">Base Fare</th>
                      <th className="pb-3 font-semibold">Reservation Fee</th>
                      <th className="pb-3 font-semibold">Superfast Charge</th>
                      <th className="pb-3 font-semibold">GST (5%)</th>
                      <th className="pb-3 font-semibold text-right">Total Payable</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {Object.entries(fareResult.faresByClass).map(([cls, details]: [string, any]) => (
                      <tr key={cls} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 font-bold text-cyan-400 font-mono">{cls}</td>
                        <td className="py-3 text-slate-300 font-mono">₹{details.baseFare}</td>
                        <td className="py-3 text-slate-400 font-mono">₹{details.reservationCharge}</td>
                        <td className="py-3 text-slate-400 font-mono">₹{details.superfastCharge}</td>
                        <td className="py-3 text-slate-400 font-mono">₹{details.gst}</td>
                        <td className="py-3 font-bold text-emerald-400 font-mono text-sm text-right">
                          ₹{details.totalFare}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PNR STATUS */}
      {activeTab === 'pnr' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-purple-950/30 border border-purple-800/50 text-xs text-purple-300">
              <ShieldCheck className="w-4 h-4 shrink-0 text-purple-400" />
              <span>Strict Privacy Policy: Passenger personal data is NEVER stored or logged. Fictional test numbers supported.</span>
            </div>

            <form onSubmit={handleLookupPnr} className="flex items-end gap-4 text-xs">
              <div className="flex-1 max-w-sm">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  10-Digit PNR Number
                </label>
                <input
                  type="text"
                  value={pnrInput}
                  onChange={e => setPnrInput(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="Enter 10 digits (e.g. 8421928374)"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-sm tracking-widest focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={pnrLoading}
                className="px-6 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium shadow-md shadow-cyan-950"
              >
                {pnrLoading ? 'Verifying...' : 'Retrieve PNR Status'}
              </button>
            </form>
          </div>

          {pnrError && (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{pnrError}</span>
            </div>
          )}

          {pnrResult && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-bold text-cyan-400">PNR #{pnrResult.pnr}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                      {pnrResult.chartStatus}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-white mt-1">
                    {pnrResult.trainNumber} - {pnrResult.trainName}
                  </div>
                </div>
                <div className="text-xs text-slate-400">
                  Journey Date: <b className="text-slate-200">{pnrResult.journeyDate}</b> • Class: <b className="text-slate-200">{pnrResult.classType}</b>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Passenger Roster</h4>
                <div className="space-y-2">
                  {pnrResult.passengers.map((p: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-950/60 rounded-xl border border-slate-850 flex items-center justify-between text-xs"
                    >
                      <div className="font-medium text-slate-200">
                        Passenger #{p.passengerIndex} (Masked Name)
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-slate-400">
                          Booking: <span className="font-mono text-slate-300">{p.bookingStatus}</span>
                        </div>
                        <div className="font-bold font-mono text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded border border-emerald-800">
                          Current: {p.currentStatus}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: CONFIRMATION PREDICTION */}
      {activeTab === 'prediction' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
            <form onSubmit={handlePredictConfirmation} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Train</label>
                <input
                  type="text"
                  value={predTrain}
                  onChange={e => setPredTrain(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Class</label>
                <select
                  value={predClass}
                  onChange={e => setPredClass(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                >
                  <option value="1A">1A (First AC)</option>
                  <option value="2A">2A (Second AC)</option>
                  <option value="3A">3A (Third AC)</option>
                  <option value="SL">SL (Sleeper)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Current Waitlist Position</label>
                <input
                  type="number"
                  value={predWl}
                  onChange={e => setPredWl(parseInt(e.target.value, 10))}
                  min={1}
                  max={250}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div>
                <button
                  type="submit"
                  disabled={predLoading}
                  className="w-full py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium shadow-md shadow-cyan-950"
                >
                  {predLoading ? 'Computing Odds...' : 'Predict Odds'}
                </button>
              </div>
            </form>
          </div>

          {predResult && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-base font-bold text-white">Statistical Heuristic Forecast</span>
                <span className="text-xs px-2.5 py-1 rounded bg-slate-800 text-cyan-300 font-mono">
                  Waitlist #{predResult.currentWaitlist}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl bg-slate-950/60 border border-slate-850">
                <div className="text-center sm:text-left">
                  <div className="text-3xl font-extrabold text-cyan-400 font-mono">
                    {predResult.predictedProbabilityPercent}%
                  </div>
                  <span className="text-xs font-semibold text-slate-300 mt-1 block">
                    {predResult.trend}
                  </span>
                </div>
                <div className="text-xs text-slate-400 border-l border-slate-800 pl-6">
                  {predResult.historicalPatternInsight}
                </div>
              </div>

              <p className="text-[10px] text-slate-500">
                * Estimates are statistical heuristic projections based on historical chart clearance behavior and do not constitute an official Indian Railways reservation guarantee.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: CANCELLATION REFUND RULES */}
      {activeTab === 'refund' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
            <form onSubmit={handleCalculateRefund} className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-end text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Ticket Fare (₹)</label>
                <input
                  type="number"
                  value={refundAmount}
                  onChange={e => setRefundAmount(parseFloat(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Class</label>
                <select
                  value={refundClass}
                  onChange={e => setRefundClass(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                >
                  <option value="1A">1A (First AC)</option>
                  <option value="2A">2A (Second AC)</option>
                  <option value="3A">3A (Third AC)</option>
                  <option value="SL">SL (Sleeper)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Hours Prior</label>
                <input
                  type="number"
                  value={refundHours}
                  onChange={e => setRefundHours(parseFloat(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Status</label>
                <select
                  value={refundStatus}
                  onChange={e => setRefundStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                >
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="RAC">RAC</option>
                  <option value="WAITLIST">WAITLIST</option>
                </select>
              </div>
              <div>
                <button
                  type="submit"
                  disabled={refundLoading}
                  className="w-full py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium shadow-md shadow-cyan-950"
                >
                  {refundLoading ? 'Calculating...' : 'Compute Refund'}
                </button>
              </div>
            </form>
          </div>

          {refundResult && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-white">Refund Rule Calculation Summary</h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-850">
                  <span className="text-slate-500 block">Original Fare Paid</span>
                  <span className="text-xl font-bold font-mono text-white mt-1 block">₹{refundResult.ticketAmount}</span>
                </div>
                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-850">
                  <span className="text-slate-500 block">Clerkage / Cancellation Charge</span>
                  <span className="text-xl font-bold font-mono text-rose-400 mt-1 block">- ₹{refundResult.clerkageOrCancellationFee}</span>
                </div>
                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-850">
                  <span className="text-slate-500 block">Net Refund Amount</span>
                  <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">₹{refundResult.refundAmount}</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-850 border border-slate-800 text-xs text-slate-300">
                <span className="font-semibold text-cyan-400">Applicable Gazette Rule: </span>
                {refundResult.applicableRule}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
