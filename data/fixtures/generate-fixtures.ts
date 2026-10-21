// Script to generate comprehensive, valid, and consistent Indian Railway fixtures for RailSync Offline Mode.
import fs from 'fs';
import path from 'path';

const FIXTURES_DIR = path.resolve(process.cwd(), 'data/fixtures');

// --- 1. STATIONS (150+ stations across India) ---
const rawStations = [
  // Major Northern Junctions
  { code: 'NDLS', name: 'New Delhi', city: 'New Delhi', state: 'Delhi', zone: 'NR', platforms: 16, lat: 28.6424, lng: 77.2195 },
  { code: 'DLI', name: 'Old Delhi Junction', city: 'Old Delhi', state: 'Delhi', zone: 'NR', platforms: 16, lat: 28.6616, lng: 77.2307 },
  { code: 'NZM', name: 'Hazrat Nizamuddin', city: 'New Delhi', state: 'Delhi', zone: 'NR', platforms: 9, lat: 28.5888, lng: 77.2534 },
  { code: 'ANVT', name: 'Anand Vihar Terminal', city: 'New Delhi', state: 'Delhi', zone: 'NR', platforms: 7, lat: 28.6508, lng: 77.3152 },
  { code: 'GZB', name: 'Ghaziabad Junction', city: 'Ghaziabad', state: 'Uttar Pradesh', zone: 'NR', platforms: 6, lat: 28.6678, lng: 77.4334 },
  { code: 'AGC', name: 'Agra Cantt', city: 'Agra', state: 'Uttar Pradesh', zone: 'NCR', platforms: 6, lat: 27.1585, lng: 77.9942 },
  { code: 'AF', name: 'Agra Fort', city: 'Agra', state: 'Uttar Pradesh', zone: 'NCR', platforms: 4, lat: 27.1818, lng: 78.0163 },
  { code: 'GWL', name: 'Gwalior Junction', city: 'Gwalior', state: 'Madhya Pradesh', zone: 'NCR', platforms: 5, lat: 26.2163, lng: 78.1882 },
  { code: 'VGLJ', name: 'Virangana Lakshmibai Jhansi', city: 'Jhansi', state: 'Uttar Pradesh', zone: 'NCR', platforms: 8, lat: 25.4484, lng: 78.5685 },
  { code: 'CNB', name: 'Kanpur Central', city: 'Kanpur', state: 'Uttar Pradesh', zone: 'NCR', platforms: 10, lat: 26.4537, lng: 80.3512 },
  { code: 'LKO', name: 'Lucknow Charbagh NR', city: 'Lucknow', state: 'Uttar Pradesh', zone: 'NR', platforms: 9, lat: 26.8322, lng: 80.9197 },
  { code: 'LJN', name: 'Lucknow Junction NER', city: 'Lucknow', state: 'Uttar Pradesh', zone: 'NER', platforms: 6, lat: 26.8310, lng: 80.9215 },
  { code: 'PRYJ', name: 'Prayagraj Junction', city: 'Prayagraj', state: 'Uttar Pradesh', zone: 'NCR', platforms: 10, lat: 25.4358, lng: 81.8463 },
  { code: 'BSB', name: 'Varanasi Junction', city: 'Varanasi', state: 'Uttar Pradesh', zone: 'NR', platforms: 9, lat: 25.3216, lng: 82.9873 },
  { code: 'DDU', name: 'Pt. Deen Dayal Upadhyaya Junction', city: 'Mughalsarai', state: 'Uttar Pradesh', zone: 'ECR', platforms: 8, lat: 25.2818, lng: 83.1197 },
  { code: 'GKP', name: 'Gorakhpur Junction', city: 'Gorakhpur', state: 'Uttar Pradesh', zone: 'NER', platforms: 10, lat: 26.7575, lng: 83.3813 },
  { code: 'BE', name: 'Bareilly Junction', city: 'Bareilly', state: 'Uttar Pradesh', zone: 'NR', platforms: 6, lat: 28.3440, lng: 79.4180 },
  { code: 'MB', name: 'Moradabad Junction', city: 'Moradabad', state: 'Uttar Pradesh', zone: 'NR', platforms: 7, lat: 28.8386, lng: 78.7733 },
  { code: 'SRE', name: 'Saharanpur Junction', city: 'Saharanpur', state: 'Uttar Pradesh', zone: 'NR', platforms: 6, lat: 29.9640, lng: 77.5460 },
  { code: 'UMB', name: 'Ambala Cantt Junction', city: 'Ambala', state: 'Haryana', zone: 'NR', platforms: 8, lat: 30.3340, lng: 76.8380 },
  { code: 'CDG', name: 'Chandigarh Junction', city: 'Chandigarh', state: 'Chandigarh', zone: 'NR', platforms: 6, lat: 30.7020, lng: 76.8200 },
  { code: 'KLK', name: 'Kalka', city: 'Kalka', state: 'Haryana', zone: 'NR', platforms: 3, lat: 30.8350, lng: 76.9360 },
  { code: 'LDH', name: 'Ludhiana Junction', city: 'Ludhiana', state: 'Punjab', zone: 'NR', platforms: 7, lat: 30.9010, lng: 75.8573 },
  { code: 'ASR', name: 'Amritsar Junction', city: 'Amritsar', state: 'Punjab', zone: 'NR', platforms: 6, lat: 31.6340, lng: 74.8723 },
  { code: 'JUC', name: 'Jalandhar City', city: 'Jalandhar', state: 'Punjab', zone: 'NR', platforms: 5, lat: 31.3260, lng: 75.5762 },
  { code: 'JAT', name: 'Jammu Tawi', city: 'Jammu', state: 'Jammu & Kashmir', zone: 'NR', platforms: 4, lat: 32.7060, lng: 74.8800 },
  { code: 'SVDK', name: 'Shri Mata Vaishno Devi Katra', city: 'Katra', state: 'Jammu & Kashmir', zone: 'NR', platforms: 5, lat: 32.9900, lng: 74.9300 },
  { code: 'UHP', name: 'Udhampur', city: 'Udhampur', state: 'Jammu & Kashmir', zone: 'NR', platforms: 3, lat: 32.9260, lng: 75.1320 },
  { code: 'HW', name: 'Haridwar Junction', city: 'Haridwar', state: 'Uttarakhand', zone: 'NR', platforms: 6, lat: 29.9457, lng: 78.1642 },
  { code: 'DDN', name: 'Dehradun', city: 'Dehradun', state: 'Uttarakhand', zone: 'NR', platforms: 4, lat: 30.3150, lng: 78.0322 },

  // Western & Central Hubs
  { code: 'MMCT', name: 'Mumbai Central', city: 'Mumbai', state: 'Maharashtra', zone: 'WR', platforms: 8, lat: 18.9696, lng: 72.8193 },
  { code: 'CSMT', name: 'Chhatrapati Shivaji Maharaj Terminus', city: 'Mumbai', state: 'Maharashtra', zone: 'CR', platforms: 18, lat: 18.9400, lng: 72.8354 },
  { code: 'BDTS', name: 'Bandra Terminus', city: 'Mumbai', state: 'Maharashtra', zone: 'WR', platforms: 7, lat: 19.0620, lng: 72.8410 },
  { code: 'LTT', name: 'Lokmanya Tilak Terminus', city: 'Mumbai', state: 'Maharashtra', zone: 'CR', platforms: 5, lat: 19.0694, lng: 72.8911 },
  { code: 'DR', name: 'Dadar Central', city: 'Mumbai', state: 'Maharashtra', zone: 'CR', platforms: 8, lat: 19.0180, lng: 72.8430 },
  { code: 'DDR', name: 'Dadar Western', city: 'Mumbai', state: 'Maharashtra', zone: 'WR', platforms: 7, lat: 19.0190, lng: 72.8420 },
  { code: 'BVI', name: 'Borivali', city: 'Mumbai', state: 'Maharashtra', zone: 'WR', platforms: 10, lat: 19.2290, lng: 72.8570 },
  { code: 'TNA', name: 'Thane', city: 'Thane', state: 'Maharashtra', zone: 'CR', platforms: 10, lat: 19.1860, lng: 72.9760 },
  { code: 'KYN', name: 'Kalyan Junction', city: 'Kalyan', state: 'Maharashtra', zone: 'CR', platforms: 8, lat: 19.2437, lng: 73.1355 },
  { code: 'IGP', name: 'Igatpuri', city: 'Igatpuri', state: 'Maharashtra', zone: 'CR', platforms: 4, lat: 19.6970, lng: 73.5600 },
  { code: 'NK', name: 'Nashik Road', city: 'Nashik', state: 'Maharashtra', zone: 'CR', platforms: 4, lat: 19.9570, lng: 73.8370 },
  { code: 'MMR', name: 'Manmad Junction', city: 'Manmad', state: 'Maharashtra', zone: 'CR', platforms: 6, lat: 20.2520, lng: 74.4380 },
  { code: 'BSL', name: 'Bhusaval Junction', city: 'Bhusaval', state: 'Maharashtra', zone: 'CR', platforms: 8, lat: 21.0500, lng: 75.7900 },
  { code: 'JL', name: 'Jalgaon Junction', city: 'Jalgaon', state: 'Maharashtra', zone: 'CR', platforms: 5, lat: 21.0040, lng: 75.5630 },
  { code: 'NGP', name: 'Nagpur Junction', city: 'Nagpur', state: 'Maharashtra', zone: 'CR', platforms: 8, lat: 21.1525, lng: 79.0887 },
  { code: 'PUNE', name: 'Pune Junction', city: 'Pune', state: 'Maharashtra', zone: 'CR', platforms: 6, lat: 18.5289, lng: 73.8744 },
  { code: 'LNL', name: 'Lonavala', city: 'Lonavala', state: 'Maharashtra', zone: 'CR', platforms: 3, lat: 18.7530, lng: 73.4070 },
  { code: 'SUR', name: 'Solapur Junction', city: 'Solapur', state: 'Maharashtra', zone: 'CR', platforms: 5, lat: 17.6599, lng: 75.9064 },
  { code: 'KOP', name: 'Chhatrapati Shahu Maharaj Terminus Kolhapur', city: 'Kolhapur', state: 'Maharashtra', zone: 'CR', platforms: 3, lat: 16.7020, lng: 74.2400 },
  { code: 'ST', name: 'Surat', city: 'Surat', state: 'Gujarat', zone: 'WR', platforms: 4, lat: 21.2049, lng: 72.8406 },
  { code: 'BRC', name: 'Vadodara Junction', city: 'Vadodara', state: 'Gujarat', zone: 'WR', platforms: 7, lat: 22.3107, lng: 73.1812 },
  { code: 'ADI', name: 'Ahmedabad Junction', city: 'Ahmedabad', state: 'Gujarat', zone: 'WR', platforms: 12, lat: 23.0225, lng: 72.5714 },
  { code: 'GNC', name: 'Gandhinagar Capital', city: 'Gandhinagar', state: 'Gujarat', zone: 'WR', platforms: 3, lat: 23.2320, lng: 72.6360 },
  { code: 'RJT', name: 'Rajkot Junction', city: 'Rajkot', state: 'Gujarat', zone: 'WR', platforms: 5, lat: 22.3100, lng: 70.8000 },
  { code: 'BVC', name: 'Bhavnagar Terminus', city: 'Bhavnagar', state: 'Gujarat', zone: 'WR', platforms: 3, lat: 21.7700, lng: 72.1400 },
  { code: 'JAM', name: 'Jamnagar', city: 'Jamnagar', state: 'Gujarat', zone: 'WR', platforms: 3, lat: 22.4700, lng: 70.0700 },
  { code: 'OKHA', name: 'Okha', city: 'Okha', state: 'Gujarat', zone: 'WR', platforms: 2, lat: 22.4660, lng: 69.0720 },
  { code: 'BH', name: 'Bharuch Junction', city: 'Bharuch', state: 'Gujarat', zone: 'WR', platforms: 5, lat: 21.7100, lng: 72.9900 },
  { code: 'ANND', name: 'Anand Junction', city: 'Anand', state: 'Gujarat', zone: 'WR', platforms: 5, lat: 22.5600, lng: 72.9500 },
  { code: 'VAPI', name: 'Vapi', city: 'Vapi', state: 'Gujarat', zone: 'WR', platforms: 3, lat: 20.3700, lng: 72.9100 },
  { code: 'BL', name: 'Valsad', city: 'Valsad', state: 'Gujarat', zone: 'WR', platforms: 5, lat: 20.6100, lng: 72.9300 },

  // Rajasthan & MP Hubs
  { code: 'JP', name: 'Jaipur Junction', city: 'Jaipur', state: 'Rajasthan', zone: 'NWR', platforms: 8, lat: 26.9196, lng: 75.7878 },
  { code: 'AII', name: 'Ajmer Junction', city: 'Ajmer', state: 'Rajasthan', zone: 'NWR', platforms: 5, lat: 26.4520, lng: 74.6390 },
  { code: 'JU', name: 'Jodhpur Junction', city: 'Jodhpur', state: 'Rajasthan', zone: 'NWR', platforms: 5, lat: 26.2840, lng: 73.0180 },
  { code: 'BKN', name: 'Bikaner Junction', city: 'Bikaner', state: 'Rajasthan', zone: 'NWR', platforms: 6, lat: 28.0160, lng: 73.3110 },
  { code: 'UDZ', name: 'Udaipur City', city: 'Udaipur', state: 'Rajasthan', zone: 'NWR', platforms: 5, lat: 24.5800, lng: 73.6900 },
  { code: 'KOTA', name: 'Kota Junction', city: 'Kota', state: 'Rajasthan', zone: 'WCR', platforms: 5, lat: 25.1800, lng: 75.8300 },
  { code: 'SWM', name: 'Sawai Madhopur Junction', city: 'Sawai Madhopur', state: 'Rajasthan', zone: 'WCR', platforms: 4, lat: 26.0000, lng: 76.3600 },
  { code: 'BTE', name: 'Bharatpur Junction', city: 'Bharatpur', state: 'Rajasthan', zone: 'WCR', platforms: 3, lat: 27.2200, lng: 77.4900 },
  { code: 'RTM', name: 'Ratlam Junction', city: 'Ratlam', state: 'Madhya Pradesh', zone: 'WR', platforms: 7, lat: 23.3441, lng: 75.0357 },
  { code: 'UJN', name: 'Ujjain Junction', city: 'Ujjain', state: 'Madhya Pradesh', zone: 'WR', platforms: 8, lat: 23.1793, lng: 75.7849 },
  { code: 'INDB', name: 'Indore Junction', city: 'Indore', state: 'Madhya Pradesh', zone: 'WR', platforms: 6, lat: 22.7196, lng: 75.8679 },
  { code: 'BPL', name: 'Bhopal Junction', city: 'Bhopal', state: 'Madhya Pradesh', zone: 'WCR', platforms: 6, lat: 23.2599, lng: 77.4126 },
  { code: 'RKMP', name: 'Rani Kamlapati', city: 'Bhopal', state: 'Madhya Pradesh', zone: 'WCR', platforms: 5, lat: 23.2201, lng: 77.4428 },
  { code: 'ET', name: 'Itarsi Junction', city: 'Itarsi', state: 'Madhya Pradesh', zone: 'WCR', platforms: 8, lat: 22.6120, lng: 77.7640 },
  { code: 'JBP', name: 'Jabalpur Junction', city: 'Jabalpur', state: 'Madhya Pradesh', zone: 'WCR', platforms: 6, lat: 23.1686, lng: 79.9535 },
  { code: 'KTE', name: 'Katni Junction', city: 'Katni', state: 'Madhya Pradesh', zone: 'WCR', platforms: 6, lat: 23.8340, lng: 80.4000 },
  { code: 'STA', name: 'Satna Junction', city: 'Satna', state: 'Madhya Pradesh', zone: 'WCR', platforms: 3, lat: 24.5800, lng: 80.8300 },
  { code: 'REWA', name: 'Rewa', city: 'Rewa', state: 'Madhya Pradesh', zone: 'WCR', platforms: 2, lat: 24.5300, lng: 81.3000 },

  // Eastern & North-Eastern Hubs
  { code: 'HWH', name: 'Howrah Junction', city: 'Kolkata', state: 'West Bengal', zone: 'ER', platforms: 23, lat: 22.5830, lng: 88.3426 },
  { code: 'SDAH', name: 'Sealdah', city: 'Kolkata', state: 'West Bengal', zone: 'ER', platforms: 21, lat: 22.5697, lng: 88.3713 },
  { code: 'KOAA', name: 'Kolkata Railway Station', city: 'Kolkata', state: 'West Bengal', zone: 'ER', platforms: 5, lat: 22.6020, lng: 88.3740 },
  { code: 'SHM', name: 'Shalimar Terminus', city: 'Kolkata', state: 'West Bengal', zone: 'SER', platforms: 3, lat: 22.5560, lng: 88.3120 },
  { code: 'KGP', name: 'Kharagpur Junction', city: 'Kharagpur', state: 'West Bengal', zone: 'SER', platforms: 12, lat: 22.3400, lng: 87.3200 },
  { code: 'BWN', name: 'Barddhaman Junction', city: 'Bardhaman', state: 'West Bengal', zone: 'ER', platforms: 8, lat: 23.2400, lng: 87.8600 },
  { code: 'ASN', name: 'Asansol Junction', city: 'Asansol', state: 'West Bengal', zone: 'ER', platforms: 8, lat: 23.6889, lng: 86.9661 },
  { code: 'DHN', name: 'Dhanbad Junction', city: 'Dhanbad', state: 'Jharkhand', zone: 'ECR', platforms: 8, lat: 23.7917, lng: 86.4304 },
  { code: 'GMO', name: 'Netaji SC Bose Gomoh', city: 'Gomoh', state: 'Jharkhand', zone: 'ECR', platforms: 6, lat: 23.8740, lng: 86.1550 },
  { code: 'KQR', name: 'Koderma Junction', city: 'Koderma', state: 'Jharkhand', zone: 'ECR', platforms: 5, lat: 24.4670, lng: 85.5900 },
  { code: 'GAYA', name: 'Gaya Junction', city: 'Gaya', state: 'Bihar', zone: 'ECR', platforms: 9, lat: 24.8000, lng: 85.0000 },
  { code: 'PNBE', name: 'Patna Junction', city: 'Patna', state: 'Bihar', zone: 'ECR', platforms: 10, lat: 25.6025, lng: 85.1376 },
  { code: 'DNR', name: 'Danapur', city: 'Patna', state: 'Bihar', zone: 'ECR', platforms: 5, lat: 25.6300, lng: 85.0400 },
  { code: 'RJPB', name: 'Rajendra Nagar Terminal', city: 'Patna', state: 'Bihar', zone: 'ECR', platforms: 4, lat: 25.5990, lng: 85.1630 },
  { code: 'MFP', name: 'Muzaffarpur Junction', city: 'Muzaffarpur', state: 'Bihar', zone: 'ECR', platforms: 6, lat: 26.1200, lng: 85.3800 },
  { code: 'SPJ', name: 'Samastipur Junction', city: 'Samastipur', state: 'Bihar', zone: 'ECR', platforms: 7, lat: 25.8600, lng: 85.7800 },
  { code: 'DBG', name: 'Darbhanga Junction', city: 'Darbhanga', state: 'Bihar', zone: 'ECR', platforms: 5, lat: 26.1500, lng: 85.9000 },
  { code: 'BJU', name: 'Barauni Junction', city: 'Barauni', state: 'Bihar', zone: 'ECR', platforms: 9, lat: 25.4700, lng: 85.9700 },
  { code: 'KIR', name: 'Katihar Junction', city: 'Katihar', state: 'Bihar', zone: 'NFR', platforms: 8, lat: 25.5400, lng: 87.5700 },
  { code: 'RNC', name: 'Ranchi Junction', city: 'Ranchi', state: 'Jharkhand', zone: 'SER', platforms: 6, lat: 23.3500, lng: 85.3300 },
  { code: 'HTE', name: 'Hatia', city: 'Ranchi', state: 'Jharkhand', zone: 'SER', platforms: 4, lat: 23.3100, lng: 85.3100 },
  { code: 'TATA', name: 'Tatanagar Junction', city: 'Jamshedpur', state: 'Jharkhand', zone: 'SER', platforms: 6, lat: 22.7667, lng: 86.2000 },
  { code: 'BBS', name: 'Bhubaneswar', city: 'Bhubaneswar', state: 'Odisha', zone: 'ECoR', platforms: 6, lat: 20.2644, lng: 85.8400 },
  { code: 'CTC', name: 'Cuttack Junction', city: 'Cuttack', state: 'Odisha', zone: 'ECoR', platforms: 6, lat: 20.4600, lng: 85.8900 },
  { code: 'PURI', name: 'Puri', city: 'Puri', state: 'Odisha', zone: 'ECoR', platforms: 8, lat: 19.8100, lng: 85.8300 },
  { code: 'ROU', name: 'Rourkela Junction', city: 'Rourkela', state: 'Odisha', zone: 'SER', platforms: 5, lat: 22.2260, lng: 84.8870 },
  { code: 'SBP', name: 'Sambalpur Junction', city: 'Sambalpur', state: 'Odisha', zone: 'ECoR', platforms: 4, lat: 21.4800, lng: 83.9800 },
  { code: 'NJP', name: 'New Jalpaiguri Junction', city: 'Siliguri', state: 'West Bengal', zone: 'NFR', platforms: 6, lat: 26.6800, lng: 88.4400 },
  { code: 'GHY', name: 'Guwahati', city: 'Guwahati', state: 'Assam', zone: 'NFR', platforms: 7, lat: 26.1824, lng: 91.7516 },
  { code: 'KYQ', name: 'Kamakhya Junction', city: 'Guwahati', state: 'Assam', zone: 'NFR', platforms: 4, lat: 26.1550, lng: 91.7080 },
  { code: 'DBRG', name: 'Dibrugarh', city: 'Dibrugarh', state: 'Assam', zone: 'NFR', platforms: 5, lat: 27.4800, lng: 94.9100 },
  { code: 'APDJ', name: 'Alipurduar Junction', city: 'Alipurduar', state: 'West Bengal', zone: 'NFR', platforms: 3, lat: 26.5100, lng: 89.5400 },

  // Southern & South-Western Hubs
  { code: 'MAS', name: 'MGR Chennai Central', city: 'Chennai', state: 'Tamil Nadu', zone: 'SR', platforms: 17, lat: 13.0827, lng: 80.2707 },
  { code: 'MS', name: 'Chennai Egmore', city: 'Chennai', state: 'Tamil Nadu', zone: 'SR', platforms: 11, lat: 13.0780, lng: 80.2600 },
  { code: 'TBM', name: 'Tambaram', city: 'Chennai', state: 'Tamil Nadu', zone: 'SR', platforms: 8, lat: 12.9250, lng: 80.1170 },
  { code: 'AJJ', name: 'Arakkonam Junction', city: 'Arakkonam', state: 'Tamil Nadu', zone: 'SR', platforms: 8, lat: 13.0800, lng: 79.6700 },
  { code: 'KPD', name: 'Katpadi Junction', city: 'Vellore', state: 'Tamil Nadu', zone: 'SR', platforms: 5, lat: 12.9700, lng: 79.1300 },
  { code: 'JTJ', name: 'Jolarpettai Junction', city: 'Jolarpettai', state: 'Tamil Nadu', zone: 'SR', platforms: 5, lat: 12.5700, lng: 78.5800 },
  { code: 'SA', name: 'Salem Junction', city: 'Salem', state: 'Tamil Nadu', zone: 'SR', platforms: 6, lat: 11.6600, lng: 78.1200 },
  { code: 'ED', name: 'Erode Junction', city: 'Erode', state: 'Tamil Nadu', zone: 'SR', platforms: 4, lat: 11.3400, lng: 77.7200 },
  { code: 'TUP', name: 'Tiruppur', city: 'Tiruppur', state: 'Tamil Nadu', zone: 'SR', platforms: 2, lat: 11.1080, lng: 77.3410 },
  { code: 'CBE', name: 'Coimbatore Junction', city: 'Coimbatore', state: 'Tamil Nadu', zone: 'SR', platforms: 6, lat: 11.0000, lng: 76.9600 },
  { code: 'MDU', name: 'Madurai Junction', city: 'Madurai', state: 'Tamil Nadu', zone: 'SR', platforms: 8, lat: 9.9200, lng: 78.1100 },
  { code: 'TPJ', name: 'Tiruchchirappalli Junction', city: 'Trichy', state: 'Tamil Nadu', zone: 'SR', platforms: 8, lat: 10.7900, lng: 78.6800 },
  { code: 'TEN', name: 'Tirunelveli Junction', city: 'Tirunelveli', state: 'Tamil Nadu', zone: 'SR', platforms: 5, lat: 8.7300, lng: 77.7000 },
  { code: 'CAPE', name: 'Kanniyakumari', city: 'Kanyakumari', state: 'Tamil Nadu', zone: 'SR', platforms: 4, lat: 8.0880, lng: 77.5380 },
  { code: 'PGT', name: 'Palakkad Junction', city: 'Palakkad', state: 'Kerala', zone: 'SR', platforms: 5, lat: 10.7900, lng: 76.6500 },
  { code: 'TCR', name: 'Thrisur', city: 'Thrissur', state: 'Kerala', zone: 'SR', platforms: 4, lat: 10.5100, lng: 76.2100 },
  { code: 'ERS', name: 'Ernakulam Junction', city: 'Kochi', state: 'Kerala', zone: 'SR', platforms: 6, lat: 9.9670, lng: 76.2900 },
  { code: 'ERN', name: 'Ernakulam Town', city: 'Kochi', state: 'Kerala', zone: 'SR', platforms: 2, lat: 9.9910, lng: 76.2890 },
  { code: 'ALLP', name: 'Alappuzha', city: 'Alappuzha', state: 'Kerala', zone: 'SR', platforms: 3, lat: 9.4900, lng: 76.3200 },
  { code: 'KTYM', name: 'Kottayam', city: 'Kottayam', state: 'Kerala', zone: 'SR', platforms: 3, lat: 9.5900, lng: 76.5200 },
  { code: 'QLN', name: 'Kollam Junction', city: 'Kollam', state: 'Kerala', zone: 'SR', platforms: 6, lat: 8.8800, lng: 76.6000 },
  { code: 'TVC', name: 'Thiruvananthapuram Central', city: 'Thiruvananthapuram', state: 'Kerala', zone: 'SR', platforms: 5, lat: 8.4870, lng: 76.9530 },
  { code: 'CLT', name: 'Kozhikode Main', city: 'Kozhikode', state: 'Kerala', zone: 'SR', platforms: 4, lat: 11.2400, lng: 75.7800 },
  { code: 'CAN', name: 'Kannur', city: 'Kannur', state: 'Kerala', zone: 'SR', platforms: 3, lat: 11.8700, lng: 75.3700 },
  { code: 'MAQ', name: 'Mangaluru Central', city: 'Mangalore', state: 'Karnataka', zone: 'SR', platforms: 3, lat: 12.8600, lng: 74.8400 },
  { code: 'MAJN', name: 'Mangaluru Junction', city: 'Mangalore', state: 'Karnataka', zone: 'SR', platforms: 3, lat: 12.8700, lng: 74.8700 },

  // Karnataka & Andhra / Telangana Hubs
  { code: 'SBC', name: 'KSR Bengaluru City', city: 'Bengaluru', state: 'Karnataka', zone: 'SWR', platforms: 10, lat: 12.9784, lng: 77.5682 },
  { code: 'YPR', name: 'Yesvantpur Junction', city: 'Bengaluru', state: 'Karnataka', zone: 'SWR', platforms: 6, lat: 13.0240, lng: 77.5500 },
  { code: 'SMVB', name: 'Sir M. Visvesvaraya Terminal Bengaluru', city: 'Bengaluru', state: 'Karnataka', zone: 'SWR', platforms: 7, lat: 13.0030, lng: 77.6540 },
  { code: 'BNC', name: 'Bengaluru Cantt', city: 'Bengaluru', state: 'Karnataka', zone: 'SWR', platforms: 3, lat: 12.9930, lng: 77.6000 },
  { code: 'MYS', name: 'Mysuru Junction', city: 'Mysuru', state: 'Karnataka', zone: 'SWR', platforms: 6, lat: 12.3160, lng: 76.6450 },
  { code: 'UBL', name: 'SSS Hubballi Junction', city: 'Hubballi', state: 'Karnataka', zone: 'SWR', platforms: 8, lat: 15.3480, lng: 75.1480 },
  { code: 'DWR', name: 'Dharwad', city: 'Dharwad', state: 'Karnataka', zone: 'SWR', platforms: 3, lat: 15.4500, lng: 75.0000 },
  { code: 'BGM', name: 'Belagavi', city: 'Belgaum', state: 'Karnataka', zone: 'SWR', platforms: 3, lat: 15.8600, lng: 74.5000 },
  { code: 'BAY', name: 'Ballari Junction', city: 'Bellary', state: 'Karnataka', zone: 'SWR', platforms: 4, lat: 15.1500, lng: 76.9200 },
  { code: 'HPT', name: 'Hosapete Junction (Hampi)', city: 'Hospet', state: 'Karnataka', zone: 'SWR', platforms: 4, lat: 15.2700, lng: 76.3900 },
  { code: 'SC', name: 'Secunderabad Junction', city: 'Hyderabad', state: 'Telangana', zone: 'SCR', platforms: 10, lat: 17.4339, lng: 78.5048 },
  { code: 'HYB', name: 'Hyderabad Deccan Nampally', city: 'Hyderabad', state: 'Telangana', zone: 'SCR', platforms: 6, lat: 17.3920, lng: 78.4680 },
  { code: 'KCG', name: 'Kacheguda', city: 'Hyderabad', state: 'Telangana', zone: 'SCR', platforms: 5, lat: 17.3870, lng: 78.4980 },
  { code: 'KZJ', name: 'Kazipet Junction', city: 'Warangal', state: 'Telangana', zone: 'SCR', platforms: 4, lat: 17.9700, lng: 79.5200 },
  { code: 'WL', name: 'Warangal', city: 'Warangal', state: 'Telangana', zone: 'SCR', platforms: 3, lat: 17.9800, lng: 79.6000 },
  { code: 'BZA', name: 'Vijayawada Junction', city: 'Vijayawada', state: 'Andhra Pradesh', zone: 'SCR', platforms: 10, lat: 16.5175, lng: 80.6200 },
  { code: 'GNT', name: 'Guntur Junction', city: 'Guntur', state: 'Andhra Pradesh', zone: 'SCR', platforms: 7, lat: 16.3000, lng: 80.4400 },
  { code: 'VSKP', name: 'Visakhapatnam Junction', city: 'Visakhapatnam', state: 'Andhra Pradesh', zone: 'ECoR', platforms: 8, lat: 17.7214, lng: 83.2878 },
  { code: 'RJY', name: 'Rajahmundry', city: 'Rajahmundry', state: 'Andhra Pradesh', zone: 'SCR', platforms: 3, lat: 17.0000, lng: 81.7800 },
  { code: 'SLO', name: 'Samalkot Junction', city: 'Samalkot', state: 'Andhra Pradesh', zone: 'SCR', platforms: 3, lat: 17.0500, lng: 82.1600 },
  { code: 'OGL', name: 'Ongole', city: 'Ongole', state: 'Andhra Pradesh', zone: 'SCR', platforms: 3, lat: 15.5000, lng: 80.0500 },
  { code: 'NLR', name: 'Nellore', city: 'Nellore', state: 'Andhra Pradesh', zone: 'SCR', platforms: 4, lat: 14.4400, lng: 79.9800 },
  { code: 'GDR', name: 'Gudur Junction', city: 'Gudur', state: 'Andhra Pradesh', zone: 'SCR', platforms: 4, lat: 14.1500, lng: 79.8500 },
  { code: 'RU', name: 'Renigunta Junction', city: 'Tirupati', state: 'Andhra Pradesh', zone: 'SCR', platforms: 6, lat: 13.6500, lng: 79.5200 },
  { code: 'TPTY', name: 'Tirupati Main', city: 'Tirupati', state: 'Andhra Pradesh', zone: 'SCR', platforms: 6, lat: 13.6288, lng: 79.4192 },
  { code: 'GTL', name: 'Guntakal Junction', city: 'Guntakal', state: 'Andhra Pradesh', zone: 'SCR', platforms: 7, lat: 15.1700, lng: 77.3700 },

  // Central, Chhattisgarh & Goa Hubs
  { code: 'R', name: 'Raipur Junction', city: 'Raipur', state: 'Chhattisgarh', zone: 'SECR', platforms: 7, lat: 21.2500, lng: 81.6300 },
  { code: 'BSP', name: 'Bilaspur Junction', city: 'Bilaspur', state: 'Chhattisgarh', zone: 'SECR', platforms: 8, lat: 22.0800, lng: 82.1500 },
  { code: 'DURG', name: 'Durg Junction', city: 'Durg', state: 'Chhattisgarh', zone: 'SECR', platforms: 6, lat: 21.1900, lng: 81.2800 },
  { code: 'MAO', name: 'Madgaon Junction', city: 'Margao', state: 'Goa', zone: 'KR', platforms: 4, lat: 15.2750, lng: 73.9770 },
  { code: 'THVM', name: 'Thivim', city: 'Thivim', state: 'Goa', zone: 'KR', platforms: 2, lat: 15.6300, lng: 73.8400 },
  { code: 'RN', name: 'Ratnagiri', city: 'Ratnagiri', state: 'Maharashtra', zone: 'KR', platforms: 3, lat: 16.9900, lng: 73.3300 },
  { code: 'ROHA', name: 'Roha', city: 'Roha', state: 'Maharashtra', zone: 'CR', platforms: 3, lat: 18.4400, lng: 73.1200 },
  { code: 'PNVL', name: 'Panvel Junction', city: 'Navi Mumbai', state: 'Maharashtra', zone: 'CR', platforms: 7, lat: 18.9900, lng: 73.1200 }
];

console.log(`Prepared ${rawStations.length} station records.`);

// Station lookup map
const stationMap = new Map();
rawStations.forEach(s => stationMap.set(s.code, s));

// --- 2. TRAIN TEMPLATES (100+ Trains) ---
// We will generate 100+ realistic trains spanning Rajdhani, Vande Bharat, Shatabdi, Superfast, Duronto, Mail/Express, Jan Shatabdi, Garib Rath, Tejas.
const trainDefinitions = [
  // Flagship Rajdhanis
  { num: '12951', name: 'Mumbai Central - New Delhi Tejas Rajdhani Express', cat: 'Rajdhani Express', speed: 'Superfast (130 km/h)', route: ['MMCT', 'BVI', 'ST', 'BRC', 'RTM', 'KOTA', 'NDLS'], days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], classes: ['1A', '2A', '3A'], rake: 'LHB Tejas' },
  { num: '12952', name: 'New Delhi - Mumbai Central Tejas Rajdhani Express', cat: 'Rajdhani Express', speed: 'Superfast (130 km/h)', route: ['NDLS', 'KOTA', 'RTM', 'BRC', 'ST', 'BVI', 'MMCT'], days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], classes: ['1A', '2A', '3A'], rake: 'LHB Tejas' },
  { num: '12953', name: 'August Kranti Tejas Rajdhani Express', cat: 'Rajdhani Express', speed: 'Superfast (130 km/h)', route: ['MMCT', 'BVI', 'VAPI', 'BL', 'ST', 'BRC', 'RTM', 'KOTA', 'SWM', 'NZM'], days: ['Daily'], classes: ['1A', '2A', '3A'], rake: 'LHB Tejas' },
  { num: '12954', name: 'Hazrat Nizamuddin - Mumbai Central August Kranti Rajdhani', cat: 'Rajdhani Express', speed: 'Superfast (130 km/h)', route: ['NZM', 'SWM', 'KOTA', 'RTM', 'BRC', 'ST', 'BL', 'VAPI', 'BVI', 'MMCT'], days: ['Daily'], classes: ['1A', '2A', '3A'], rake: 'LHB Tejas' },
  { num: '12301', name: 'Howrah - New Delhi Rajdhani Express (via Gaya)', cat: 'Rajdhani Express', speed: 'Superfast (130 km/h)', route: ['HWH', 'ASN', 'DHN', 'GMO', 'GAYA', 'DDU', 'PRYJ', 'CNB', 'NDLS'], days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], classes: ['1A', '2A', '3A'], rake: 'LHB' },
  { num: '12302', name: 'New Delhi - Howrah Rajdhani Express (via Gaya)', cat: 'Rajdhani Express', speed: 'Superfast (130 km/h)', route: ['NDLS', 'CNB', 'PRYJ', 'DDU', 'GAYA', 'GMO', 'DHN', 'ASN', 'HWH'], days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], classes: ['1A', '2A', '3A'], rake: 'LHB' },
  { num: '12305', name: 'Howrah - New Delhi Rajdhani Express (via Patna)', cat: 'Rajdhani Express', speed: 'Superfast (130 km/h)', route: ['HWH', 'ASN', 'PNBE', 'DDU', 'PRYJ', 'CNB', 'NDLS'], days: ['Sun'], classes: ['1A', '2A', '3A'], rake: 'LHB' },
  { num: '12306', name: 'New Delhi - Howrah Rajdhani Express (via Patna)', cat: 'Rajdhani Express', speed: 'Superfast (130 km/h)', route: ['NDLS', 'CNB', 'PRYJ', 'DDU', 'PNBE', 'ASN', 'HWH'], days: ['Fri'], classes: ['1A', '2A', '3A'], rake: 'LHB' },
  { num: '22691', name: 'KSR Bengaluru - Hazrat Nizamuddin Rajdhani Express', cat: 'Rajdhani Express', speed: 'Superfast (130 km/h)', route: ['SBC', 'SC', 'KZJ', 'NGP', 'ET', 'BPL', 'VGLJ', 'GWL', 'AGC', 'NZM'], days: ['Daily'], classes: ['1A', '2A', '3A'], rake: 'LHB' },
  { num: '22692', name: 'Hazrat Nizamuddin - KSR Bengaluru Rajdhani Express', cat: 'Rajdhani Express', speed: 'Superfast (130 km/h)', route: ['NZM', 'AGC', 'GWL', 'VGLJ', 'BPL', 'ET', 'NGP', 'KZJ', 'SC', 'SBC'], days: ['Daily'], classes: ['1A', '2A', '3A'], rake: 'LHB' },
  { num: '12431', name: 'Thiruvananthapuram - Hazrat Nizamuddin Rajdhani Express', cat: 'Rajdhani Express', speed: 'Superfast (130 km/h)', route: ['TVC', 'QLN', 'ALLP', 'ERS', 'TCR', 'CLT', 'CAN', 'MAJN', 'MAO', 'RN', 'PNVL', 'BVI', 'ST', 'BRC', 'RTM', 'KOTA', 'NZM'], days: ['Tue', 'Thu', 'Fri'], classes: ['1A', '2A', '3A'], rake: 'LHB' },
  { num: '12432', name: 'Hazrat Nizamuddin - Thiruvananthapuram Rajdhani Express', cat: 'Rajdhani Express', speed: 'Superfast (130 km/h)', route: ['NZM', 'KOTA', 'RTM', 'BRC', 'ST', 'BVI', 'PNVL', 'RN', 'MAO', 'MAJN', 'CAN', 'CLT', 'TCR', 'ERS', 'ALLP', 'QLN', 'TVC'], days: ['Sun', 'Tue', 'Wed'], classes: ['1A', '2A', '3A'], rake: 'LHB' },
  { num: '12433', name: 'MGR Chennai Central - Hazrat Nizamuddin Rajdhani', cat: 'Rajdhani Express', speed: 'Superfast (130 km/h)', route: ['MAS', 'BZA', 'WL', 'NGP', 'ET', 'BPL', 'VGLJ', 'GWL', 'AGC', 'NZM'], days: ['Fri', 'Sun'], classes: ['1A', '2A', '3A'], rake: 'LHB' },
  { num: '12434', name: 'Hazrat Nizamuddin - MGR Chennai Central Rajdhani', cat: 'Rajdhani Express', speed: 'Superfast (130 km/h)', route: ['NZM', 'AGC', 'GWL', 'VGLJ', 'BPL', 'ET', 'NGP', 'WL', 'BZA', 'MAS'], days: ['Wed', 'Fri'], classes: ['1A', '2A', '3A'], rake: 'LHB' },

  // Vande Bharat Expresses
  { num: '22436', name: 'New Delhi - Varanasi Vande Bharat Express', cat: 'Vande Bharat Express', speed: 'Semi-High Speed (160 km/h)', route: ['NDLS', 'CNB', 'PRYJ', 'BSB'], days: ['Tue', 'Wed', 'Fri', 'Sat', 'Sun'], classes: ['CC', 'EC'], rake: 'Vande Bharat Train18' },
  { num: '22435', name: 'Varanasi - New Delhi Vande Bharat Express', cat: 'Vande Bharat Express', speed: 'Semi-High Speed (160 km/h)', route: ['BSB', 'PRYJ', 'CNB', 'NDLS'], days: ['Tue', 'Wed', 'Fri', 'Sat', 'Sun'], classes: ['CC', 'EC'], rake: 'Vande Bharat Train18' },
  { num: '20901', name: 'Mumbai Central - Gandhinagar Capital Vande Bharat', cat: 'Vande Bharat Express', speed: 'Semi-High Speed (160 km/h)', route: ['MMCT', 'BVI', 'VAPI', 'ST', 'BRC', 'ADI', 'GNC'], days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], classes: ['CC', 'EC'], rake: 'Vande Bharat Train18' },
  { num: '20902', name: 'Gandhinagar Capital - Mumbai Central Vande Bharat', cat: 'Vande Bharat Express', speed: 'Semi-High Speed (160 km/h)', route: ['GNC', 'ADI', 'BRC', 'ST', 'VAPI', 'BVI', 'MMCT'], days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], classes: ['CC', 'EC'], rake: 'Vande Bharat Train18' },
  { num: '20103', name: 'CSMT Mumbai - Madgaon Vande Bharat Express', cat: 'Vande Bharat Express', speed: 'Semi-High Speed (160 km/h)', route: ['CSMT', 'DR', 'TNA', 'PNVL', 'ROHA', 'RN', 'THVM', 'MAO'], days: ['Mon', 'Wed', 'Fri'], classes: ['CC', 'EC'], rake: 'Vande Bharat Train18' },
  { num: '20104', name: 'Madgaon - CSMT Mumbai Vande Bharat Express', cat: 'Vande Bharat Express', speed: 'Semi-High Speed (160 km/h)', route: ['MAO', 'THVM', 'RN', 'ROHA', 'PNVL', 'TNA', 'DR', 'CSMT'], days: ['Tue', 'Thu', 'Sat'], classes: ['CC', 'EC'], rake: 'Vande Bharat Train18' },
  { num: '20607', name: 'MGR Chennai Central - Mysuru Vande Bharat Express', cat: 'Vande Bharat Express', speed: 'Semi-High Speed (160 km/h)', route: ['MAS', 'KPD', 'JTJ', 'BNC', 'SBC', 'MYS'], days: ['Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon'], classes: ['CC', 'EC'], rake: 'Vande Bharat Train18' },
  { num: '20608', name: 'Mysuru - MGR Chennai Central Vande Bharat Express', cat: 'Vande Bharat Express', speed: 'Semi-High Speed (160 km/h)', route: ['MYS', 'SBC', 'BNC', 'JTJ', 'KPD', 'MAS'], days: ['Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon'], classes: ['CC', 'EC'], rake: 'Vande Bharat Train18' },
  { num: '22439', name: 'New Delhi - SMVD Katra Vande Bharat Express', cat: 'Vande Bharat Express', speed: 'Semi-High Speed (160 km/h)', route: ['NDLS', 'UMB', 'LDH', 'JAT', 'SVDK'], days: ['Mon', 'Tue', 'Wed', 'Fri', 'Sat', 'Sun'], classes: ['CC', 'EC'], rake: 'Vande Bharat Train18' },
  { num: '22440', name: 'SMVD Katra - New Delhi Vande Bharat Express', cat: 'Vande Bharat Express', speed: 'Semi-High Speed (160 km/h)', route: ['SVDK', 'JAT', 'LDH', 'UMB', 'NDLS'], days: ['Mon', 'Tue', 'Wed', 'Fri', 'Sat', 'Sun'], classes: ['CC', 'EC'], rake: 'Vande Bharat Train18' },
  { num: '20833', name: 'Visakhapatnam - Secunderabad Vande Bharat Express', cat: 'Vande Bharat Express', speed: 'Semi-High Speed (160 km/h)', route: ['VSKP', 'SLO', 'RJY', 'BZA', 'WL', 'SC'], days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], classes: ['CC', 'EC'], rake: 'Vande Bharat Train18' },
  { num: '20834', name: 'Secunderabad - Visakhapatnam Vande Bharat Express', cat: 'Vande Bharat Express', speed: 'Semi-High Speed (160 km/h)', route: ['SC', 'WL', 'BZA', 'RJY', 'SLO', 'VSKP'], days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], classes: ['CC', 'EC'], rake: 'Vande Bharat Train18' },
  { num: '22301', name: 'Howrah - New Jalpaiguri Vande Bharat Express', cat: 'Vande Bharat Express', speed: 'Semi-High Speed (160 km/h)', route: ['HWH', 'BWN', 'NJP'], days: ['Mon', 'Tue', 'Thu', 'Fri', 'Sat', 'Sun'], classes: ['CC', 'EC'], rake: 'Vande Bharat Train18' },
  { num: '22302', name: 'New Jalpaiguri - Howrah Vande Bharat Express', cat: 'Vande Bharat Express', speed: 'Semi-High Speed (160 km/h)', route: ['NJP', 'BWN', 'HWH'], days: ['Mon', 'Tue', 'Thu', 'Fri', 'Sat', 'Sun'], classes: ['CC', 'EC'], rake: 'Vande Bharat Train18' },
  { num: '20171', name: 'Rani Kamlapati - Hazrat Nizamuddin Vande Bharat', cat: 'Vande Bharat Express', speed: 'Semi-High Speed (160 km/h)', route: ['RKMP', 'VGLJ', 'GWL', 'AGC', 'NZM'], days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sun'], classes: ['CC', 'EC'], rake: 'Vande Bharat Train18' },
  { num: '20172', name: 'Hazrat Nizamuddin - Rani Kamlapati Vande Bharat', cat: 'Vande Bharat Express', speed: 'Semi-High Speed (160 km/h)', route: ['NZM', 'AGC', 'GWL', 'VGLJ', 'RKMP'], days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sun'], classes: ['CC', 'EC'], rake: 'Vande Bharat Train18' },

  // Shatabdi Expresses
  { num: '12002', name: 'New Delhi - Habibganj Shatabdi Express', cat: 'Shatabdi Express', speed: 'Superfast (130 km/h)', route: ['NDLS', 'AGC', 'GWL', 'VGLJ', 'BPL', 'RKMP'], days: ['Daily'], classes: ['CC', 'EC'], rake: 'LHB Shatabdi' },
  { num: '12001', name: 'Habibganj - New Delhi Shatabdi Express', cat: 'Shatabdi Express', speed: 'Superfast (130 km/h)', route: ['RKMP', 'BPL', 'VGLJ', 'GWL', 'AGC', 'NDLS'], days: ['Daily'], classes: ['CC', 'EC'], rake: 'LHB Shatabdi' },
  { num: '12004', name: 'New Delhi - Lucknow Swarna Shatabdi Express', cat: 'Shatabdi Express', speed: 'Superfast (130 km/h)', route: ['NDLS', 'GZB', 'CNB', 'LKO'], days: ['Daily'], classes: ['CC', 'EC'], rake: 'LHB Shatabdi' },
  { num: '12003', name: 'Lucknow - New Delhi Swarna Shatabdi Express', cat: 'Shatabdi Express', speed: 'Superfast (130 km/h)', route: ['LKO', 'CNB', 'GZB', 'NDLS'], days: ['Daily'], classes: ['CC', 'EC'], rake: 'LHB Shatabdi' },
  { num: '12007', name: 'MGR Chennai Central - Mysuru Shatabdi Express', cat: 'Shatabdi Express', speed: 'Superfast (130 km/h)', route: ['MAS', 'KPD', 'JTJ', 'BNC', 'SBC', 'MYS'], days: ['Mon', 'Tue', 'Wed', 'Fri', 'Sat', 'Sun'], classes: ['CC', 'EC'], rake: 'LHB Shatabdi' },
  { num: '12008', name: 'Mysuru - MGR Chennai Central Shatabdi Express', cat: 'Shatabdi Express', speed: 'Superfast (130 km/h)', route: ['MYS', 'SBC', 'BNC', 'JTJ', 'KPD', 'MAS'], days: ['Mon', 'Tue', 'Wed', 'Fri', 'Sat', 'Sun'], classes: ['CC', 'EC'], rake: 'LHB Shatabdi' },
  { num: '12009', name: 'Mumbai Central - Ahmedabad Shatabdi Express', cat: 'Shatabdi Express', speed: 'Superfast (130 km/h)', route: ['MMCT', 'BVI', 'VAPI', 'ST', 'BH', 'BRC', 'ANND', 'ADI'], days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], classes: ['CC', 'EC'], rake: 'LHB Shatabdi' },
  { num: '12010', name: 'Ahmedabad - Mumbai Central Shatabdi Express', cat: 'Shatabdi Express', speed: 'Superfast (130 km/h)', route: ['ADI', 'ANND', 'BRC', 'BH', 'ST', 'VAPI', 'BVI', 'MMCT'], days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], classes: ['CC', 'EC'], rake: 'LHB Shatabdi' },
  { num: '12011', name: 'New Delhi - Kalka Shatabdi Express', cat: 'Shatabdi Express', speed: 'Superfast (130 km/h)', route: ['NDLS', 'UMB', 'CDG', 'KLK'], days: ['Daily'], classes: ['CC', 'EC'], rake: 'LHB Shatabdi' },
  { num: '12012', name: 'Kalka - New Delhi Shatabdi Express', cat: 'Shatabdi Express', speed: 'Superfast (130 km/h)', route: ['KLK', 'CDG', 'UMB', 'NDLS'], days: ['Daily'], classes: ['CC', 'EC'], rake: 'LHB Shatabdi' },
  { num: '12019', name: 'Howrah - Ranchi Shatabdi Express', cat: 'Shatabdi Express', speed: 'Superfast (130 km/h)', route: ['HWH', 'BWN', 'ASN', 'DHN', 'RNC'], days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], classes: ['CC', 'EC'], rake: 'LHB Shatabdi' },
  { num: '12020', name: 'Ranchi - Howrah Shatabdi Express', cat: 'Shatabdi Express', speed: 'Superfast (130 km/h)', route: ['RNC', 'DHN', 'ASN', 'BWN', 'HWH'], days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], classes: ['CC', 'EC'], rake: 'LHB Shatabdi' },

  // Duronto Expresses
  { num: '12267', name: 'Mumbai Central - Ahmedabad AC Duronto Express', cat: 'Duronto Express', speed: 'Superfast (120 km/h)', route: ['MMCT', 'ADI'], days: ['Daily'], classes: ['1A', '2A', '3A'], rake: 'LHB Duronto' },
  { num: '12268', name: 'Ahmedabad - Mumbai Central AC Duronto Express', cat: 'Duronto Express', speed: 'Superfast (120 km/h)', route: ['ADI', 'MMCT'], days: ['Daily'], classes: ['1A', '2A', '3A'], rake: 'LHB Duronto' },
  { num: '12259', name: 'Sealdah - Bikaner AC Duronto Express', cat: 'Duronto Express', speed: 'Superfast (120 km/h)', route: ['SDAH', 'DHN', 'DDU', 'CNB', 'NDLS', 'BKN'], days: ['Sun', 'Mon', 'Wed', 'Thu'], classes: ['1A', '2A', '3A'], rake: 'LHB Duronto' },
  { num: '12260', name: 'Bikaner - Sealdah AC Duronto Express', cat: 'Duronto Express', speed: 'Superfast (120 km/h)', route: ['BKN', 'NDLS', 'CNB', 'DDU', 'DHN', 'SDAH'], days: ['Mon', 'Tue', 'Thu', 'Fri'], classes: ['1A', '2A', '3A'], rake: 'LHB Duronto' },
  { num: '12285', name: 'Secunderabad - Hazrat Nizamuddin Duronto Express', cat: 'Duronto Express', speed: 'Superfast (120 km/h)', route: ['SC', 'NGP', 'BPL', 'VGLJ', 'NZM'], days: ['Thu', 'Sun'], classes: ['1A', '2A', '3A', 'SL'], rake: 'LHB Duronto' },
  { num: '12286', name: 'Hazrat Nizamuddin - Secunderabad Duronto Express', cat: 'Duronto Express', speed: 'Superfast (120 km/h)', route: ['NZM', 'VGLJ', 'BPL', 'NGP', 'SC'], days: ['Mon', 'Fri'], classes: ['1A', '2A', '3A', 'SL'], rake: 'LHB Duronto' },
  { num: '12245', name: 'Howrah - Sir M. Visvesvaraya Terminal Duronto Express', cat: 'Duronto Express', speed: 'Superfast (120 km/h)', route: ['HWH', 'BBS', 'VSKP', 'BZA', 'RU', 'SMVB'], days: ['Tue', 'Wed', 'Fri', 'Sat', 'Sun'], classes: ['1A', '2A', '3A', 'SL'], rake: 'LHB Duronto' },
  { num: '12246', name: 'SMVT Bengaluru - Howrah Duronto Express', cat: 'Duronto Express', speed: 'Superfast (120 km/h)', route: ['SMVB', 'RU', 'BZA', 'VSKP', 'BBS', 'HWH'], days: ['Sun', 'Tue', 'Thu', 'Fri', 'Sat'], classes: ['1A', '2A', '3A', 'SL'], rake: 'LHB Duronto' },

  // Superfast & Mail/Express Key Arteries
  { num: '12137', name: 'Punjab Mail', cat: 'Superfast Express', speed: 'Express (110 km/h)', route: ['CSMT', 'DR', 'KYN', 'IGP', 'NK', 'MMR', 'BSL', 'ET', 'BPL', 'VGLJ', 'GWL', 'AGC', 'NDLS', 'UMB', 'LDH', 'JUC', 'ASR'], days: ['Daily'], classes: ['1A', '2A', '3A', 'SL'], rake: 'LHB' },
  { num: '12138', name: 'Punjab Mail (Return)', cat: 'Superfast Express', speed: 'Express (110 km/h)', route: ['ASR', 'JUC', 'LDH', 'UMB', 'NDLS', 'AGC', 'GWL', 'VGLJ', 'BPL', 'ET', 'BSL', 'MMR', 'NK', 'IGP', 'KYN', 'DR', 'CSMT'], days: ['Daily'], classes: ['1A', '2A', '3A', 'SL'], rake: 'LHB' },
  { num: '12625', name: 'Kerala Express', cat: 'Superfast Express', speed: 'Superfast (110 km/h)', route: ['TVC', 'QLN', 'KTYM', 'ERN', 'TCR', 'PGT', 'CBE', 'ED', 'SA', 'JTJ', 'KPD', 'RU', 'GDR', 'NLR', 'OGL', 'BZA', 'WL', 'NGP', 'ET', 'BPL', 'VGLJ', 'GWL', 'AGC', 'NDLS'], days: ['Daily'], classes: ['2A', '3A', 'SL'], rake: 'LHB' },
  { num: '12626', name: 'Kerala Express (Return)', cat: 'Superfast Express', speed: 'Superfast (110 km/h)', route: ['NDLS', 'AGC', 'GWL', 'VGLJ', 'BPL', 'ET', 'NGP', 'WL', 'BZA', 'OGL', 'NLR', 'GDR', 'RU', 'KPD', 'JTJ', 'SA', 'ED', 'CBE', 'PGT', 'TCR', 'ERN', 'KTYM', 'QLN', 'TVC'], days: ['Daily'], classes: ['2A', '3A', 'SL'], rake: 'LHB' },
  { num: '12621', name: 'Tamil Nadu Express', cat: 'Superfast Express', speed: 'Superfast (120 km/h)', route: ['MAS', 'BZA', 'WL', 'NGP', 'ET', 'BPL', 'VGLJ', 'GWL', 'AGC', 'NDLS'], days: ['Daily'], classes: ['1A', '2A', '3A', 'SL'], rake: 'LHB' },
  { num: '12622', name: 'Tamil Nadu Express (Return)', cat: 'Superfast Express', speed: 'Superfast (120 km/h)', route: ['NDLS', 'AGC', 'GWL', 'VGLJ', 'BPL', 'ET', 'NGP', 'WL', 'BZA', 'MAS'], days: ['Daily'], classes: ['1A', '2A', '3A', 'SL'], rake: 'LHB' },
  { num: '12627', name: 'Karnataka Express', cat: 'Superfast Express', speed: 'Superfast (110 km/h)', route: ['SBC', 'DWR', 'SUR', 'PUNE', 'MMR', 'BSL', 'ET', 'BPL', 'VGLJ', 'GWL', 'AGC', 'NDLS'], days: ['Daily'], classes: ['1A', '2A', '3A', 'SL'], rake: 'LHB' },
  { num: '12628', name: 'Karnataka Express (Return)', cat: 'Superfast Express', speed: 'Superfast (110 km/h)', route: ['NDLS', 'AGC', 'GWL', 'VGLJ', 'BPL', 'ET', 'BSL', 'MMR', 'PUNE', 'SUR', 'DWR', 'SBC'], days: ['Daily'], classes: ['1A', '2A', '3A', 'SL'], rake: 'LHB' },
  { num: '12839', name: 'Howrah - MGR Chennai Central Mail', cat: 'Mail/Express', speed: 'Express (110 km/h)', route: ['HWH', 'KGP', 'CTC', 'BBS', 'VSKP', 'RJY', 'BZA', 'OGL', 'NLR', 'MAS'], days: ['Daily'], classes: ['1A', '2A', '3A', 'SL'], rake: 'LHB' },
  { num: '12840', name: 'MGR Chennai Central - Howrah Mail', cat: 'Mail/Express', speed: 'Express (110 km/h)', route: ['MAS', 'NLR', 'OGL', 'BZA', 'RJY', 'VSKP', 'BBS', 'CTC', 'KGP', 'HWH'], days: ['Daily'], classes: ['1A', '2A', '3A', 'SL'], rake: 'LHB' },
  { num: '12801', name: 'Purushottam Express', cat: 'Superfast Express', speed: 'Superfast (120 km/h)', route: ['PURI', 'BBS', 'CTC', 'TATA', 'GMO', 'KQR', 'GAYA', 'DDU', 'PRYJ', 'CNB', 'NDLS'], days: ['Daily'], classes: ['1A', '2A', '3A', 'SL'], rake: 'LHB' },
  { num: '12802', name: 'Purushottam Express (Return)', cat: 'Superfast Express', speed: 'Superfast (120 km/h)', route: ['NDLS', 'CNB', 'PRYJ', 'DDU', 'GAYA', 'KQR', 'GMO', 'TATA', 'CTC', 'BBS', 'PURI'], days: ['Daily'], classes: ['1A', '2A', '3A', 'SL'], rake: 'LHB' },
  { num: '12141', name: 'Pataliputra Express', cat: 'Superfast Express', speed: 'Superfast (110 km/h)', route: ['LTT', 'TNA', 'KYN', 'NK', 'MMR', 'BSL', 'ET', 'JBP', 'STA', 'DDU', 'PNBE'], days: ['Daily'], classes: ['2A', '3A', 'SL'], rake: 'LHB' },
  { num: '12142', name: 'Pataliputra Express (Return)', cat: 'Superfast Express', speed: 'Superfast (110 km/h)', route: ['PNBE', 'DDU', 'STA', 'JBP', 'ET', 'BSL', 'MMR', 'NK', 'KYN', 'TNA', 'LTT'], days: ['Daily'], classes: ['2A', '3A', 'SL'], rake: 'LHB' },
  { num: '12925', name: 'Paschim Express', cat: 'Superfast Express', speed: 'Superfast (110 km/h)', route: ['BDTS', 'BVI', 'VAPI', 'BL', 'ST', 'BRC', 'RTM', 'KOTA', 'SWM', 'GZB', 'NDLS', 'UMB', 'CDG', 'KLK'], days: ['Daily'], classes: ['1A', '2A', '3A', 'SL'], rake: 'LHB' },
  { num: '12926', name: 'Paschim Express (Return)', cat: 'Superfast Express', speed: 'Superfast (110 km/h)', route: ['KLK', 'CDG', 'UMB', 'NDLS', 'GZB', 'SWM', 'KOTA', 'RTM', 'BRC', 'ST', 'BL', 'VAPI', 'BVI', 'BDTS'], days: ['Daily'], classes: ['1A', '2A', '3A', 'SL'], rake: 'LHB' },
  { num: '12051', name: 'Jan Shatabdi Express (Mumbai - Madgaon)', cat: 'Jan Shatabdi Express', speed: 'Superfast (110 km/h)', route: ['CSMT', 'DR', 'TNA', 'PNVL', 'RN', 'THVM', 'MAO'], days: ['Daily'], classes: ['2S', 'CC'], rake: 'LHB Jan Shatabdi' },
  { num: '12052', name: 'Jan Shatabdi Express (Madgaon - Mumbai)', cat: 'Jan Shatabdi Express', speed: 'Superfast (110 km/h)', route: ['MAO', 'THVM', 'RN', 'PNVL', 'TNA', 'DR', 'CSMT'], days: ['Daily'], classes: ['2S', 'CC'], rake: 'LHB Jan Shatabdi' },
  { num: '12423', name: 'Dibrugarh - New Delhi Rajdhani Express', cat: 'Rajdhani Express', speed: 'Superfast (130 km/h)', route: ['DBRG', 'GHY', 'NJP', 'KIR', 'BJU', 'PNBE', 'DDU', 'PRYJ', 'CNB', 'NDLS'], days: ['Daily'], classes: ['1A', '2A', '3A'], rake: 'LHB' },
  { num: '12424', name: 'New Delhi - Dibrugarh Rajdhani Express', cat: 'Rajdhani Express', speed: 'Superfast (130 km/h)', route: ['NDLS', 'CNB', 'PRYJ', 'DDU', 'PNBE', 'BJU', 'KIR', 'NJP', 'GHY', 'DBRG'], days: ['Daily'], classes: ['1A', '2A', '3A'], rake: 'LHB' },
  { num: '12217', name: 'Sampark Kranti Express (Kochuveli - Chandigarh)', cat: 'Sampark Kranti', speed: 'Superfast (110 km/h)', route: ['TVC', 'QLN', 'ALLP', 'ERS', 'TCR', 'CLT', 'CAN', 'MAJN', 'MAO', 'RN', 'PNVL', 'ST', 'BRC', 'RTM', 'KOTA', 'NZM', 'UMB', 'CDG'], days: ['Mon', 'Sat'], classes: ['2A', '3A', 'SL'], rake: 'LHB' },
  { num: '12218', name: 'Sampark Kranti Express (Chandigarh - Kochuveli)', cat: 'Sampark Kranti', speed: 'Superfast (110 km/h)', route: ['CDG', 'UMB', 'NZM', 'KOTA', 'RTM', 'BRC', 'ST', 'PNVL', 'RN', 'MAO', 'MAJN', 'CAN', 'CLT', 'TCR', 'ERS', 'ALLP', 'QLN', 'TVC'], days: ['Wed', 'Fri'], classes: ['2A', '3A', 'SL'], rake: 'LHB' },
  { num: '12909', name: 'Bandra Terminus - Hazrat Nizamuddin Garib Rath', cat: 'Garib Rath Express', speed: 'Superfast (120 km/h)', route: ['BDTS', 'BVI', 'ST', 'BRC', 'RTM', 'KOTA', 'NZM'], days: ['Tue', 'Thu', 'Sat'], classes: ['3A'], rake: 'LHB Garib Rath' },
  { num: '12910', name: 'Hazrat Nizamuddin - Bandra Terminus Garib Rath', cat: 'Garib Rath Express', speed: 'Superfast (120 km/h)', route: ['NZM', 'KOTA', 'RTM', 'BRC', 'ST', 'BVI', 'BDTS'], days: ['Wed', 'Fri', 'Sun'], classes: ['3A'], rake: 'LHB Garib Rath' },
  { num: '12413', name: 'Pooja Superfast Express (Ajmer - Jammu Tawi)', cat: 'Superfast Express', speed: 'Superfast (110 km/h)', route: ['AII', 'JP', 'DLI', 'UMB', 'LDH', 'JAT'], days: ['Daily'], classes: ['2A', '3A', 'SL'], rake: 'LHB' },
  { num: '12414', name: 'Pooja Superfast Express (Jammu Tawi - Ajmer)', cat: 'Superfast Express', speed: 'Superfast (110 km/h)', route: ['JAT', 'LDH', 'UMB', 'DLI', 'JP', 'AII'], days: ['Daily'], classes: ['2A', '3A', 'SL'], rake: 'LHB' },
  { num: '12057', name: 'New Delhi - Una Himachal Jan Shatabdi', cat: 'Jan Shatabdi Express', speed: 'Express (110 km/h)', route: ['NDLS', 'UMB', 'CDG'], days: ['Daily'], classes: ['2S', 'CC'], rake: 'LHB' },
  { num: '12058', name: 'Una Himachal - New Delhi Jan Shatabdi', cat: 'Jan Shatabdi Express', speed: 'Express (110 km/h)', route: ['CDG', 'UMB', 'NDLS'], days: ['Daily'], classes: ['2S', 'CC'], rake: 'LHB' },
  { num: '12061', name: 'Rani Kamlapati - Jabalpur Jan Shatabdi', cat: 'Jan Shatabdi Express', speed: 'Express (110 km/h)', route: ['RKMP', 'ET', 'JBP'], days: ['Daily'], classes: ['2S', 'CC'], rake: 'LHB' },
  { num: '12062', name: 'Jabalpur - Rani Kamlapati Jan Shatabdi', cat: 'Jan Shatabdi Express', speed: 'Express (110 km/h)', route: ['JBP', 'ET', 'RKMP'], days: ['Daily'], classes: ['2S', 'CC'], rake: 'LHB' },
  { num: '12859', name: 'Gitanjali Express (CSMT - Howrah)', cat: 'Superfast Express', speed: 'Superfast (110 km/h)', route: ['CSMT', 'DR', 'KYN', 'IGP', 'NK', 'JL', 'BSL', 'NGP', 'DURG', 'R', 'BSP', 'ROU', 'TATA', 'KGP', 'HWH'], days: ['Daily'], classes: ['2A', '3A', 'SL'], rake: 'LHB' },
  { num: '12860', name: 'Gitanjali Express (Howrah - CSMT)', cat: 'Superfast Express', speed: 'Superfast (110 km/h)', route: ['HWH', 'KGP', 'TATA', 'ROU', 'BSP', 'R', 'DURG', 'NGP', 'BSL', 'JL', 'NK', 'IGP', 'KYN', 'DR', 'CSMT'], days: ['Daily'], classes: ['2A', '3A', 'SL'], rake: 'LHB' },
  { num: '12163', name: 'LTT Mumbai - MGR Chennai Central Superfast', cat: 'Superfast Express', speed: 'Superfast (110 km/h)', route: ['LTT', 'TNA', 'KYN', 'LNL', 'PUNE', 'SUR', 'GTL', 'RU', 'AJJ', 'MAS'], days: ['Daily'], classes: ['2A', '3A', 'SL'], rake: 'LHB' },
  { num: '12164', name: 'MGR Chennai Central - LTT Mumbai Superfast', cat: 'Superfast Express', speed: 'Superfast (110 km/h)', route: ['MAS', 'AJJ', 'RU', 'GTL', 'SUR', 'PUNE', 'LNL', 'KYN', 'TNA', 'LTT'], days: ['Daily'], classes: ['2A', '3A', 'SL'], rake: 'LHB' },
  { num: '12649', name: 'Karnataka Sampark Kranti (Yesvantpur - Nizamuddin)', cat: 'Sampark Kranti', speed: 'Superfast (110 km/h)', route: ['YPR', 'DWR', 'SUR', 'ET', 'BPL', 'VGLJ', 'GWL', 'AGC', 'NZM'], days: ['Mon', 'Wed', 'Sat', 'Sun'], classes: ['1A', '2A', '3A', 'SL'], rake: 'LHB' },
  { num: '12650', name: 'Karnataka Sampark Kranti (Nizamuddin - Yesvantpur)', cat: 'Sampark Kranti', speed: 'Superfast (110 km/h)', route: ['NZM', 'AGC', 'GWL', 'VGLJ', 'BPL', 'ET', 'SUR', 'DWR', 'YPR'], days: ['Mon', 'Tue', 'Thu', 'Sat'], classes: ['1A', '2A', '3A', 'SL'], rake: 'LHB' },
  { num: '12979', name: 'Bandra Terminus - Jaipur Superfast Express', cat: 'Superfast Express', speed: 'Superfast (110 km/h)', route: ['BDTS', 'BVI', 'VAPI', 'BL', 'ST', 'BRC', 'RTM', 'KOTA', 'SWM', 'JP'], days: ['Tue', 'Thu', 'Sat'], classes: ['1A', '2A', '3A', 'SL'], rake: 'LHB' },
  { num: '12980', name: 'Jaipur - Bandra Terminus Superfast Express', cat: 'Superfast Express', speed: 'Superfast (110 km/h)', route: ['JP', 'SWM', 'KOTA', 'RTM', 'BRC', 'ST', 'BL', 'VAPI', 'BVI', 'BDTS'], days: ['Mon', 'Wed', 'Fri'], classes: ['1A', '2A', '3A', 'SL'], rake: 'LHB' },
  { num: '12445', name: 'Uttar Sampark Kranti (New Delhi - Shri Mata Vaishno Devi)', cat: 'Sampark Kranti', speed: 'Superfast (110 km/h)', route: ['NDLS', 'UMB', 'LDH', 'JAT', 'UHP', 'SVDK'], days: ['Daily'], classes: ['1A', '2A', '3A', 'SL'], rake: 'LHB' },
  { num: '12446', name: 'Uttar Sampark Kranti (Shri Mata Vaishno Devi - New Delhi)', cat: 'Sampark Kranti', speed: 'Superfast (110 km/h)', route: ['SVDK', 'UHP', 'JAT', 'LDH', 'UMB', 'NDLS'], days: ['Daily'], classes: ['1A', '2A', '3A', 'SL'], rake: 'LHB' },
  { num: '12723', name: 'Telangana Express (Hyderabad - New Delhi)', cat: 'Superfast Express', speed: 'Superfast (110 km/h)', route: ['HYB', 'SC', 'KZJ', 'NGP', 'ET', 'BPL', 'VGLJ', 'GWL', 'AGC', 'NDLS'], days: ['Daily'], classes: ['1A', '2A', '3A', 'SL'], rake: 'LHB' },
  { num: '12724', name: 'Telangana Express (New Delhi - Hyderabad)', cat: 'Superfast Express', speed: 'Superfast (110 km/h)', route: ['NDLS', 'AGC', 'GWL', 'VGLJ', 'BPL', 'ET', 'NGP', 'KZJ', 'SC', 'HYB'], days: ['Daily'], classes: ['1A', '2A', '3A', 'SL'], rake: 'LHB' },
  { num: '12393', name: 'Sampoorna Kranti Express (Rajendra Nagar - New Delhi)', cat: 'Superfast Express', speed: 'Superfast (130 km/h)', route: ['RJPB', 'PNBE', 'DDU', 'CNB', 'NDLS'], days: ['Daily'], classes: ['1A', '2A', '3A', 'SL'], rake: 'LHB' },
  { num: '12394', name: 'Sampoorna Kranti Express (New Delhi - Rajendra Nagar)', cat: 'Superfast Express', speed: 'Superfast (130 km/h)', route: ['NDLS', 'CNB', 'DDU', 'PNBE', 'RJPB'], days: ['Daily'], classes: ['1A', '2A', '3A', 'SL'], rake: 'LHB' },
  { num: '12295', name: 'Sanghamitra Express (SMVT Bengaluru - Danapur)', cat: 'Superfast Express', speed: 'Superfast (110 km/h)', route: ['SMVB', 'JTJ', 'KPD', 'AJJ', 'MAS', 'GDR', 'OGL', 'BZA', 'WL', 'NGP', 'ET', 'JBP', 'STA', 'DDU', 'DNR'], days: ['Daily'], classes: ['2A', '3A', 'SL'], rake: 'LHB' },
  { num: '12296', name: 'Sanghamitra Express (Danapur - SMVT Bengaluru)', cat: 'Superfast Express', speed: 'Superfast (110 km/h)', route: ['DNR', 'DDU', 'STA', 'JBP', 'ET', 'NGP', 'WL', 'BZA', 'OGL', 'GDR', 'MAS', 'AJJ', 'KPD', 'JTJ', 'SMVB'], days: ['Daily'], classes: ['2A', '3A', 'SL'], rake: 'LHB' },
  { num: '12059', name: 'Kota - Hazrat Nizamuddin Jan Shatabdi', cat: 'Jan Shatabdi Express', speed: 'Express (110 km/h)', route: ['KOTA', 'SWM', 'BTE', 'NZM'], days: ['Daily'], classes: ['2S', 'CC'], rake: 'LHB' },
  { num: '12060', name: 'Hazrat Nizamuddin - Kota Jan Shatabdi', cat: 'Jan Shatabdi Express', speed: 'Express (110 km/h)', route: ['NZM', 'BTE', 'SWM', 'KOTA'], days: ['Daily'], classes: ['2S', 'CC'], rake: 'LHB' },
  { num: '12079', name: 'KSR Bengaluru - Hubballi Jan Shatabdi', cat: 'Jan Shatabdi Express', speed: 'Express (110 km/h)', route: ['SBC', 'YPR', 'UBL'], days: ['Daily'], classes: ['2S', 'CC'], rake: 'LHB' },
  { num: '12080', name: 'Hubballi - KSR Bengaluru Jan Shatabdi', cat: 'Jan Shatabdi Express', speed: 'Express (110 km/h)', route: ['UBL', 'YPR', 'SBC'], days: ['Daily'], classes: ['2S', 'CC'], rake: 'LHB' },
  { num: '12401', name: 'Nanda Devi AC Express (Kota - Dehradun)', cat: 'Superfast Express', speed: 'Superfast (110 km/h)', route: ['KOTA', 'SWM', 'BTE', 'NZM', 'GZB', 'MB', 'HW', 'DDN'], days: ['Daily'], classes: ['1A', '2A', '3A'], rake: 'LHB' },
  { num: '12402', name: 'Nanda Devi AC Express (Dehradun - Kota)', cat: 'Superfast Express', speed: 'Superfast (110 km/h)', route: ['DDN', 'HW', 'MB', 'GZB', 'NZM', 'BTE', 'SWM', 'KOTA'], days: ['Daily'], classes: ['1A', '2A', '3A'], rake: 'LHB' },
  { num: '12833', name: 'Howrah - Ahmedabad Superfast Express', cat: 'Superfast Express', speed: 'Express (110 km/h)', route: ['HWH', 'KGP', 'TATA', 'ROU', 'BSP', 'R', 'DURG', 'NGP', 'BSL', 'JL', 'ST', 'BRC', 'ANND', 'ADI'], days: ['Daily'], classes: ['2A', '3A', 'SL'], rake: 'LHB' },
  { num: '12834', name: 'Ahmedabad - Howrah Superfast Express', cat: 'Superfast Express', speed: 'Express (110 km/h)', route: ['ADI', 'ANND', 'BRC', 'ST', 'JL', 'BSL', 'NGP', 'DURG', 'R', 'BSP', 'ROU', 'TATA', 'KGP', 'HWH'], days: ['Daily'], classes: ['2A', '3A', 'SL'], rake: 'LHB' },
  { num: '12703', name: 'Falaknuma Express (Howrah - Secunderabad)', cat: 'Superfast Express', speed: 'Superfast (110 km/h)', route: ['HWH', 'KGP', 'CTC', 'BBS', 'VSKP', 'SLO', 'RJY', 'BZA', 'GNT', 'KZJ', 'SC'], days: ['Daily'], classes: ['1A', '2A', '3A', 'SL'], rake: 'LHB' },
  { num: '12704', name: 'Falaknuma Express (Secunderabad - Howrah)', cat: 'Superfast Express', speed: 'Superfast (110 km/h)', route: ['SC', 'KZJ', 'GNT', 'BZA', 'RJY', 'SLO', 'VSKP', 'BBS', 'CTC', 'KGP', 'HWH'], days: ['Daily'], classes: ['1A', '2A', '3A', 'SL'], rake: 'LHB' },
  { num: '12675', name: 'Kovai Express (MGR Chennai - Coimbatore)', cat: 'Superfast Express', speed: 'Superfast (110 km/h)', route: ['MAS', 'AJJ', 'KPD', 'JTJ', 'SA', 'ED', 'TUP', 'CBE'], days: ['Daily'], classes: ['2S', 'CC'], rake: 'LHB' },
  { num: '12676', name: 'Kovai Express (Coimbatore - MGR Chennai)', cat: 'Superfast Express', speed: 'Superfast (110 km/h)', route: ['CBE', 'TUP', 'ED', 'SA', 'JTJ', 'KPD', 'AJJ', 'MAS'], days: ['Daily'], classes: ['2S', 'CC'], rake: 'LHB' },
  { num: '12635', name: 'Vaigai Superfast Express (Chennai Egmore - Madurai)', cat: 'Superfast Express', speed: 'Superfast (110 km/h)', route: ['MS', 'TBM', 'TPJ', 'MDU'], days: ['Daily'], classes: ['2S', 'CC'], rake: 'LHB' },
  { num: '12636', name: 'Vaigai Superfast Express (Madurai - Chennai Egmore)', cat: 'Superfast Express', speed: 'Superfast (110 km/h)', route: ['MDU', 'TPJ', 'TBM', 'MS'], days: ['Daily'], classes: ['2S', 'CC'], rake: 'LHB' },
  { num: '12111', name: 'CSMT Mumbai - Amravati Superfast', cat: 'Superfast Express', speed: 'Express (110 km/h)', route: ['CSMT', 'DR', 'KYN', 'IGP', 'NK', 'BSL'], days: ['Daily'], classes: ['1A', '2A', '3A', 'SL'], rake: 'ICF' },
  { num: '12112', name: 'Amravati - CSMT Mumbai Superfast', cat: 'Superfast Express', speed: 'Express (110 km/h)', route: ['BSL', 'NK', 'IGP', 'KYN', 'DR', 'CSMT'], days: ['Daily'], classes: ['1A', '2A', '3A', 'SL'], rake: 'ICF' },
  { num: '12903', name: 'Golden Temple Mail (Mumbai Central - Amritsar)', cat: 'Mail/Express', speed: 'Express (110 km/h)', route: ['MMCT', 'BVI', 'ST', 'BRC', 'RTM', 'KOTA', 'SWM', 'BTE', 'GZB', 'MB', 'SRE', 'UMB', 'LDH', 'JUC', 'ASR'], days: ['Daily'], classes: ['1A', '2A', '3A', 'SL'], rake: 'LHB' },
  { num: '12904', name: 'Golden Temple Mail (Amritsar - Mumbai Central)', cat: 'Mail/Express', speed: 'Express (110 km/h)', route: ['ASR', 'JUC', 'LDH', 'UMB', 'SRE', 'MB', 'GZB', 'BTE', 'SWM', 'KOTA', 'RTM', 'BRC', 'ST', 'BVI', 'MMCT'], days: ['Daily'], classes: ['1A', '2A', '3A', 'SL'], rake: 'LHB' },
  { num: '12213', name: 'Yesvantpur - Delhi Sarai Rohilla AC Duronto', cat: 'Duronto Express', speed: 'Superfast (120 km/h)', route: ['YPR', 'GTL', 'SC', 'NGP', 'BPL', 'VGLJ', 'NZM'], days: ['Sat'], classes: ['1A', '2A', '3A'], rake: 'LHB Duronto' },
  { num: '12214', name: 'Delhi Sarai Rohilla - Yesvantpur AC Duronto', cat: 'Duronto Express', speed: 'Superfast (120 km/h)', route: ['NZM', 'VGLJ', 'BPL', 'NGP', 'SC', 'GTL', 'YPR'], days: ['Mon'], classes: ['1A', '2A', '3A'], rake: 'LHB Duronto' },
  { num: '12425', name: 'New Delhi - Jammu Tawi Rajdhani Express', cat: 'Rajdhani Express', speed: 'Superfast (130 km/h)', route: ['NDLS', 'LDH', 'JAT'], days: ['Daily'], classes: ['1A', '2A', '3A'], rake: 'LHB' },
  { num: '12426', name: 'Jammu Tawi - New Delhi Rajdhani Express', cat: 'Rajdhani Express', speed: 'Superfast (130 km/h)', route: ['JAT', 'LDH', 'NDLS'], days: ['Daily'], classes: ['1A', '2A', '3A'], rake: 'LHB' },
  { num: '12015', name: 'New Delhi - Ajmer Shatabdi Express', cat: 'Shatabdi Express', speed: 'Superfast (120 km/h)', route: ['NDLS', 'JP', 'AII'], days: ['Daily'], classes: ['CC', 'EC'], rake: 'LHB Shatabdi' },
  { num: '12016', name: 'Ajmer - New Delhi Shatabdi Express', cat: 'Shatabdi Express', speed: 'Superfast (120 km/h)', route: ['AII', 'JP', 'NDLS'], days: ['Daily'], classes: ['CC', 'EC'], rake: 'LHB Shatabdi' },
  { num: '12017', name: 'New Delhi - Dehradun Shatabdi Express', cat: 'Shatabdi Express', speed: 'Superfast (120 km/h)', route: ['NDLS', 'GZB', 'HW', 'DDN'], days: ['Daily'], classes: ['CC', 'EC'], rake: 'LHB Shatabdi' },
  { num: '12018', name: 'Dehradun - New Delhi Shatabdi Express', cat: 'Shatabdi Express', speed: 'Superfast (120 km/h)', route: ['DDN', 'HW', 'GZB', 'NDLS'], days: ['Daily'], classes: ['CC', 'EC'], rake: 'LHB Shatabdi' },
  { num: '12417', name: 'Prayagraj Express (Prayagraj - New Delhi)', cat: 'Superfast Express', speed: 'Superfast (130 km/h)', route: ['PRYJ', 'CNB', 'GZB', 'NDLS'], days: ['Daily'], classes: ['1A', '2A', '3A', 'SL'], rake: 'LHB 24 Coaches' },
  { num: '12418', name: 'Prayagraj Express (New Delhi - Prayagraj)', cat: 'Superfast Express', speed: 'Superfast (130 km/h)', route: ['NDLS', 'GZB', 'CNB', 'PRYJ'], days: ['Daily'], classes: ['1A', '2A', '3A', 'SL'], rake: 'LHB 24 Coaches' },
  { num: '12555', name: 'Gorakhdham Express (Gorakhpur - Hisar)', cat: 'Superfast Express', speed: 'Superfast (110 km/h)', route: ['GKP', 'LKO', 'CNB', 'NDLS'], days: ['Daily'], classes: ['1A', '2A', '3A', 'SL'], rake: 'LHB' },
  { num: '12556', name: 'Gorakhdham Express (Hisar - Gorakhpur)', cat: 'Superfast Express', speed: 'Superfast (110 km/h)', route: ['NDLS', 'CNB', 'LKO', 'GKP'], days: ['Daily'], classes: ['1A', '2A', '3A', 'SL'], rake: 'LHB' },
  { num: '12229', name: 'Lucknow Mail (Lucknow - New Delhi)', cat: 'Superfast Express', speed: 'Superfast (110 km/h)', route: ['LKO', 'BE', 'MB', 'GZB', 'NDLS'], days: ['Daily'], classes: ['1A', '2A', '3A', 'SL'], rake: 'LHB' },
  { num: '12230', name: 'Lucknow Mail (New Delhi - Lucknow)', cat: 'Superfast Express', speed: 'Superfast (110 km/h)', route: ['NDLS', 'GZB', 'MB', 'BE', 'LKO'], days: ['Daily'], classes: ['1A', '2A', '3A', 'SL'], rake: 'LHB' },
  { num: '12915', name: 'Ashram Express (Ahmedabad - Old Delhi)', cat: 'Superfast Express', speed: 'Superfast (110 km/h)', route: ['ADI', 'AII', 'JP', 'DLI'], days: ['Daily'], classes: ['1A', '2A', '3A', 'SL'], rake: 'LHB' },
  { num: '12916', name: 'Ashram Express (Old Delhi - Ahmedabad)', cat: 'Superfast Express', speed: 'Superfast (110 km/h)', route: ['DLI', 'JP', 'AII', 'ADI'], days: ['Daily'], classes: ['1A', '2A', '3A', 'SL'], rake: 'LHB' },
  { num: '12429', name: 'Lucknow - New Delhi AC Superfast', cat: 'Superfast Express', speed: 'Superfast (120 km/h)', route: ['LKO', 'BE', 'MB', 'GZB', 'NDLS'], days: ['Daily'], classes: ['1A', '2A', '3A'], rake: 'LHB' },
  { num: '12430', name: 'New Delhi - Lucknow AC Superfast', cat: 'Superfast Express', speed: 'Superfast (120 km/h)', route: ['NDLS', 'GZB', 'MB', 'BE', 'LKO'], days: ['Daily'], classes: ['1A', '2A', '3A'], rake: 'LHB' },
  { num: '12139', name: 'Sewagram Express (CSMT - Nagpur)', cat: 'Superfast Express', speed: 'Express (110 km/h)', route: ['CSMT', 'DR', 'KYN', 'IGP', 'NK', 'MMR', 'JL', 'BSL', 'NGP'], days: ['Daily'], classes: ['2A', '3A', 'SL'], rake: 'ICF' },
  { num: '12140', name: 'Sewagram Express (Nagpur - CSMT)', cat: 'Superfast Express', speed: 'Express (110 km/h)', route: ['NGP', 'BSL', 'JL', 'MMR', 'NK', 'IGP', 'KYN', 'DR', 'CSMT'], days: ['Daily'], classes: ['2A', '3A', 'SL'], rake: 'ICF' }
];

console.log(`Prepared ${trainDefinitions.length} train templates.`);

// --- Function to build complete route with realistic times and cumulative distance ---
function buildRouteHalts(routeCodes, departureHour = 6) {
  let curDist = 0;
  let curTimeMinutes = departureHour * 60;
  const halts = [];

  for (let i = 0; i < routeCodes.length; i++) {
    const code = routeCodes[i];
    const station = stationMap.get(code);
    if (!station) {
      throw new Error(`Referenced station code not found in stations list: ${code}`);
    }

    const isOrigin = i === 0;
    const isDest = i === routeCodes.length - 1;

    // Estimate segment distance based on lat/lng or approximate 120km average
    let segmentDist = 0;
    if (i > 0) {
      const prevStation = stationMap.get(routeCodes[i - 1]);
      const dLat = (station.lat - prevStation.lat) * 111;
      const dLng = (station.lng - prevStation.lng) * 100;
      segmentDist = Math.max(30, Math.round(Math.sqrt(dLat * dLat + dLng * dLng) * 1.25));
    }
    curDist += segmentDist;

    // Travel time in minutes (avg speed 80 km/h = 0.75 min/km)
    if (i > 0) {
      curTimeMinutes += Math.round(segmentDist * 0.75);
    }

    const arrMinutes = curTimeMinutes;
    // Halt duration: 2-10 mins
    const haltDuration = isOrigin || isDest ? 0 : (segmentDist > 200 ? 10 : 3);
    const depMinutes = arrMinutes + haltDuration;
    curTimeMinutes = depMinutes;

    const formatClock = (totalMins) => {
      const dayOffset = Math.floor(totalMins / 1440);
      const minsInDay = totalMins % 1440;
      const h = String(Math.floor(minsInDay / 60)).padStart(2, '0');
      const m = String(minsInDay % 60).padStart(2, '0');
      return { time: `${h}:${m}`, day: dayOffset + 1 };
    };

    const arr = formatClock(arrMinutes);
    const dep = formatClock(depMinutes);

    halts.push({
      stationCode: station.code,
      stationName: station.name,
      scheduledArrival: isOrigin ? dep.time : arr.time,
      scheduledDeparture: isDest ? arr.time : dep.time,
      actualArrival: isOrigin ? dep.time : arr.time,
      actualDeparture: isDest ? arr.time : dep.time,
      delayArrivalMinutes: 0,
      delayDepartureMinutes: 0,
      distanceKm: curDist,
      dayNumber: arr.day,
      platform: String((i % station.platforms) + 1),
      hasDeparted: false
    });
  }

  return { halts, totalDistance: curDist, totalDuration: curTimeMinutes - (departureHour * 60) };
}

// Generate Trains Records (100 train records)
const fullTrains = [];
const liveStatusRecords = {};
const coachLayouts = {};
const platformPositions = {};

trainDefinitions.forEach((def, idx) => {
  const originStation = stationMap.get(def.route[0]);
  const destStation = stationMap.get(def.route[def.route.length - 1]);
  const startHour = (6 + (idx * 2)) % 22;
  const { halts, totalDistance, totalDuration } = buildRouteHalts(def.route, startHour);

  // Status simulation: some on time, some delayed, varying speeds
  const isDelayed = idx % 3 === 0;
  const delayMinutes = isDelayed ? ((idx * 7) % 65) + 5 : ((idx * 2) % 4);
  const statusStr = delayMinutes === 0 ? 'Running On Time' : `Delayed by ${delayMinutes}m`;
  const speed = def.cat.includes('Vande') ? 130 + (idx % 25) : 95 + (idx % 28);

  // Current location simulation: choose mid halt
  const midHaltIdx = Math.min(halts.length - 1, Math.max(0, Math.floor(halts.length * 0.4)));
  const currentHalt = halts[midHaltIdx];
  const currStation = stationMap.get(currentHalt.stationCode);

  // Mark halts up to mid as departed
  halts.forEach((h, hIdx) => {
    if (hIdx < midHaltIdx) {
      h.hasDeparted = true;
    } else if (hIdx === midHaltIdx) {
      h.hasDeparted = false;
      h.isCurrent = true;
    }
  });

  const trainObj = {
    trainNumber: def.num,
    trainName: def.name,
    category: def.cat,
    speedType: def.speed,
    origin: { code: originStation.code, name: originStation.name },
    destination: { code: destStation.code, name: destStation.name },
    totalDistanceKm: totalDistance,
    totalDurationMinutes: totalDuration,
    operatingDays: def.days,
    classes: def.classes,
    pantryAvailable: true,
    rakeType: def.rake,
    status: statusStr,
    delayMinutes,
    currentSpeedKmph: speed,
    isLive: true,
    currentLocation: {
      stationCode: currStation.code,
      stationName: currStation.name,
      distanceFromOriginKm: currentHalt.distanceKm,
      lat: currStation.lat,
      lng: currStation.lng
    },
    provenance: 'LOCAL_JSON_FIXTURE',
    exceptions: [],
    route: halts
  };

  fullTrains.push(trainObj);

  // Live status fixture entry for at least 50 trains
  if (idx < 65) {
    liveStatusRecords[def.num] = {
      trainNumber: def.num,
      trainName: def.name,
      startDate: new Date().toISOString().split('T')[0],
      lastUpdatedAt: new Date().toISOString(),
      status: statusStr,
      delayMinutes,
      currentSpeedKmph: speed,
      currentLocation: trainObj.currentLocation,
      route: halts,
      isLive: true,
      exceptions: [],
      provenance: 'LOCAL_SIMULATION'
    };
  }

  // Coach layouts for first 25 trains
  if (idx < 25) {
    const coachList = [];
    if (def.classes.includes('1A')) coachList.push({ coachCode: 'H1', classType: '1A', capacity: 24, positionFromEngine: 1 });
    if (def.classes.includes('2A')) {
      coachList.push({ coachCode: 'A1', classType: '2A', capacity: 48, positionFromEngine: 2 });
      coachList.push({ coachCode: 'A2', classType: '2A', capacity: 48, positionFromEngine: 3 });
    }
    if (def.classes.includes('3A')) {
      coachList.push({ coachCode: 'B1', classType: '3A', capacity: 64, positionFromEngine: 4 });
      coachList.push({ coachCode: 'B2', classType: '3A', capacity: 64, positionFromEngine: 5 });
      coachList.push({ coachCode: 'B3', classType: '3A', capacity: 64, positionFromEngine: 6 });
    }
    if (def.classes.includes('CC')) {
      coachList.push({ coachCode: 'C1', classType: 'CC', capacity: 78, positionFromEngine: 1 });
      coachList.push({ coachCode: 'C2', classType: 'CC', capacity: 78, positionFromEngine: 2 });
      coachList.push({ coachCode: 'C3', classType: 'CC', capacity: 78, positionFromEngine: 3 });
      coachList.push({ coachCode: 'E1', classType: 'EC', capacity: 52, positionFromEngine: 4 });
    }
    if (def.classes.includes('SL')) {
      coachList.push({ coachCode: 'S1', classType: 'SL', capacity: 72, positionFromEngine: 7 });
      coachList.push({ coachCode: 'S2', classType: 'SL', capacity: 72, positionFromEngine: 8 });
      coachList.push({ coachCode: 'S3', classType: 'SL', capacity: 72, positionFromEngine: 9 });
    }

    coachLayouts[def.num] = {
      trainNumber: def.num,
      trainName: def.name,
      rakeType: def.rake,
      totalCoaches: coachList.length + 2, // including engine & SLR
      fobAlignment: 'Center Foot Over Bridge (Stairs align near coach B2/C2)',
      coaches: coachList
    };
  }
});

// Platform positions for 35 station-train combinations
let ppCount = 0;
for (const t of fullTrains) {
  if (ppCount >= 35) break;
  const halt = t.route[0];
  const key = `${halt.stationCode}_${t.trainNumber}`;
  platformPositions[key] = {
    stationCode: halt.stationCode,
    trainNumber: t.trainNumber,
    trainName: t.trainName,
    platform: halt.platform,
    scheduledArrival: halt.scheduledArrival,
    scheduledDeparture: halt.scheduledDeparture,
    alignmentScore: 'Optimal (Near escalator & main exit)'
  };
  ppCount++;
}

// Associate train services into station objects
const stationTrainCount = new Map();
fullTrains.forEach(t => {
  t.route.forEach(h => {
    const list = stationTrainCount.get(h.stationCode) || [];
    list.push({ trainNumber: t.trainNumber, trainName: t.trainName, departure: h.scheduledDeparture });
    stationTrainCount.set(h.stationCode, list);
  });
});

const enrichedStations = rawStations.map(s => {
  const services = stationTrainCount.get(s.code) || [];
  return {
    ...s,
    electrified: true,
    totalDailyHalts: services.length,
    trainServices: services.slice(0, 15),
    sampleDepartures: services.slice(0, 6)
  };
});

// --- 3. RESERVATIONS (30 PNR examples) ---
const pnrExamples = {};
const sampleNames = ['AARAV SHARMA', 'PRIYA NAIR', 'ROHAN IYER', 'ANANYA SEN', 'VIKRAM CHOUDHURY', 'KAVITA PATEL', 'DEEPAK VERMA', 'MEERA REDDY', 'SUNIL RAO', 'POOJA JOSHI'];
for (let i = 1; i <= 30; i++) {
  const pnr = `8421${String(100000 + i)}`;
  const train = fullTrains[i % fullTrains.length];
  const originHalt = train.route[0];
  const destHalt = train.route[Math.min(train.route.length - 1, 3)];
  const isCnf = i % 3 !== 0;
  const classType = train.classes[0] || '3A';

  pnrExamples[pnr] = {
    pnr,
    trainNumber: train.trainNumber,
    trainName: train.trainName,
    journeyDate: `2026-10-${22 + (i % 8)}`,
    fromStation: originHalt.stationCode,
    toStation: destHalt.stationCode,
    boardingStation: originHalt.stationCode,
    classType,
    chartStatus: isCnf ? 'CHART PREPARED' : 'CHART NOT PREPARED',
    passengers: [
      {
        passengerIndex: 1,
        name: sampleNames[i % sampleNames.length],
        bookingStatus: isCnf ? `CNF ${classType.startsWith('1') ? 'H1' : 'B1'} ${10 + (i % 40)}` : `WL ${i + 4}`,
        currentStatus: isCnf ? `CNF ${classType.startsWith('1') ? 'H1' : 'B1'} ${10 + (i % 40)}` : `WL ${Math.max(1, i - 2)}`,
        berth: isCnf ? (i % 2 === 0 ? 'LOWER' : 'SIDE UPPER') : 'NONE',
        confirmationChancePercent: isCnf ? 100 : Math.max(35, 95 - (i * 2))
      }
    ]
  };
}

const reservationsFull = {
  pnrs: pnrExamples,
  fareRules: {
    "1A": { "basePerKm": 3.10, "resCharge": 60, "superfast": 75, "gstRate": 0.05 },
    "2A": { "basePerKm": 1.95, "resCharge": 50, "superfast": 45, "gstRate": 0.05 },
    "3A": { "basePerKm": 1.40, "resCharge": 40, "superfast": 45, "gstRate": 0.05 },
    "EC": { "basePerKm": 2.45, "resCharge": 60, "superfast": 75, "gstRate": 0.05 },
    "CC": { "basePerKm": 1.30, "resCharge": 40, "superfast": 45, "gstRate": 0.05 },
    "SL": { "basePerKm": 0.52, "resCharge": 20, "superfast": 30, "gstRate": 0.00 },
    "2S": { "basePerKm": 0.35, "resCharge": 15, "superfast": 15, "gstRate": 0.00 }
  },
  refundRules: [
    { "condition": ">48h before scheduled departure", "confirmed": "Flat cancellation fee (1A: ₹240, 2A/EC: ₹200, 3A/CC: ₹180, SL: ₹120)", "waitlist": "Clerkage fee ₹60 per passenger" },
    { "condition": "Between 48h and 12h before departure", "confirmed": "25% deduction subject to minimum flat fee", "waitlist": "Clerkage fee ₹60 per passenger" },
    { "condition": "Between 12h and 4h (charting)", "confirmed": "50% deduction subject to minimum flat fee", "waitlist": "Clerkage fee ₹60 per passenger" },
    { "condition": "<4h before departure / after charting", "confirmed": "No refund permissible", "waitlist": "Auto-cancellation with clerkage deduction" }
  ]
};

// --- 4. SUBURBAN / LOCAL TRAINS (50+ records) ---
const suburbanFull = {
  cities: [
    { id: 'mumbai', name: 'Mumbai Suburban Railway', network: 'Western / Central / Harbour', dailyRidership: '7.5 Million' },
    { id: 'delhi', name: 'Delhi Suburban EMU & Ring Railway', network: 'National Capital Region Commuter Grid', dailyRidership: '1.2 Million' },
    { id: 'chennai', name: 'Chennai Suburban & MRTS', network: 'South, West, North & Velachery MRTS', dailyRidership: '1.1 Million' },
    { id: 'kolkata', name: 'Kolkata Suburban Railway', network: 'Howrah & Sealdah Commuter Divisions', dailyRidership: '3.2 Million' },
    { id: 'bengaluru', name: 'Bengaluru Commuter Rail (MEMU)', network: 'KSR Bengaluru - Devanahalli Airport / Whitefield', dailyRidership: '0.4 Million' }
  ],
  timetables: [
    {
      corridor: 'Mumbai Western Line (Churchgate - Dahanu Road)',
      city: 'Mumbai',
      services: Array.from({ length: 15 }, (_, i) => ({
        trainId: `900${String(10 + i)}`,
        source: i % 2 === 0 ? 'Churchgate (CCG)' : 'Borivali (BVI)',
        destination: i % 3 === 0 ? 'Virar (VR)' : (i % 2 === 0 ? 'Dahanu Road (DRD)' : 'Andheri (ADH)'),
        departureTime: `${String(6 + Math.floor(i / 2)).padStart(2, '0')}:${String((i * 14) % 60).padStart(2, '0')}`,
        type: i % 4 === 0 ? 'AC Superfast' : (i % 2 === 0 ? 'Fast EMU' : 'Slow Local')
      }))
    },
    {
      corridor: 'Mumbai Central Main Line (CSMT - Kalyan - Kasara/Karjat)',
      city: 'Mumbai',
      services: Array.from({ length: 15 }, (_, i) => ({
        trainId: `970${String(10 + i)}`,
        source: 'CSMT',
        destination: i % 3 === 0 ? 'Kasara (KSRA)' : (i % 2 === 0 ? 'Karjat (KJT)' : 'Kalyan (KYN)'),
        departureTime: `${String(6 + Math.floor(i / 2)).padStart(2, '0')}:${String((i * 12) % 60).padStart(2, '0')}`,
        type: i % 3 === 0 ? 'Fast EMU' : 'Slow Local'
      }))
    },
    {
      corridor: 'Delhi NCR Commuter EMU & Ghaziabad Ring',
      city: 'Delhi',
      services: Array.from({ length: 10 }, (_, i) => ({
        trainId: `644${String(10 + i)}`,
        source: i % 2 === 0 ? 'New Delhi (NDLS)' : 'Hazrat Nizamuddin (NZM)',
        destination: i % 2 === 0 ? 'Ghaziabad (GZB)' : 'Palwal (PWL)',
        departureTime: `${String(7 + Math.floor(i / 2)).padStart(2, '0')}:${String((i * 18) % 60).padStart(2, '0')}`,
        type: 'Commuter EMU'
      }))
    },
    {
      corridor: 'Chennai Suburban (Chennai Beach - Tambaram - Chengalpattu)',
      city: 'Chennai',
      services: Array.from({ length: 10 }, (_, i) => ({
        trainId: `400${String(10 + i)}`,
        source: 'Chennai Beach (MSB)',
        destination: i % 2 === 0 ? 'Tambaram (TBM)' : 'Chengalpattu (CGL)',
        departureTime: `${String(6 + Math.floor(i / 2)).padStart(2, '0')}:${String((i * 15) % 60).padStart(2, '0')}`,
        type: 'Suburban EMU'
      }))
    },
    {
      corridor: 'Bengaluru MEMU Airport & Commuter Feeder',
      city: 'Bengaluru',
      services: Array.from({ length: 8 }, (_, i) => ({
        trainId: `065${String(10 + i)}`,
        source: 'KSR Bengaluru (SBC)',
        destination: i % 2 === 0 ? 'Kempegowda Intl Airport Halt (KIAD)' : 'Whitefield (WFD)',
        departureTime: `${String(6 + i).padStart(2, '0')}:20`,
        type: 'Airport MEMU Express'
      }))
    }
  ]
};

// --- 5. FREIGHT TRAINS (25+ records) ---
const commodities = [
  'Thermal Coal (Power Generation)', 'Double Stack ISO Containers', 'Automobiles (Maruti/Hyundai Rakes)',
  'Petroleum, Oil & Lubricants (POL)', 'Fertilizers & Urea', 'Iron Ore Pellets',
  'Cement & Clinker', 'Food Grains (FCI Special)', 'Steel Coils & Heavy TMT'
];

const corridors = [
  'Western Dedicated Freight Corridor (WDFC)', 'Eastern Dedicated Freight Corridor (EDFC)',
  'Golden Quadrilateral Freight Grid', 'East Coast Mineral & Coal Spine', 'Central High-Axle Route'
];

const freightFull = Array.from({ length: 26 }, (_, i) => {
  const comm = commodities[i % commodities.length];
  const corr = corridors[i % corridors.length];
  return {
    rakeId: `${corr.includes('WDFC') ? 'WDFC' : corr.includes('EDFC') ? 'EDFC' : 'IR-FRT'}-RAKE-${4000 + i}`,
    commodity: comm,
    corridor: corr,
    origin: i % 2 === 0 ? 'Mundra Port / JNPT' : 'Dhamra Port / Korba',
    destination: i % 2 === 0 ? 'ICD Dadri Multimodal Hub' : 'Rourkela / Bokaro Steel',
    wagons: 45 + (i % 16),
    speedKmph: 75 + (i % 25),
    currentLocation: `Signal Block Section ${(i * 17) % 120}km`,
    grossWeightTons: 3500 + ((i * 120) % 2000),
    status: i % 4 === 0 ? 'Green Wave Clearance (Automated Block)' : 'In Transit - Scheduled Passing Loop'
  };
});

// --- 6. HISTORICAL DELAY OBSERVATIONS (spanning multiple simulated days) ---
const delayHistory = [];
const baseTimestamp = Date.now() - (7 * 86400 * 1000); // 7 days ago
fullTrains.slice(0, 30).forEach((t) => {
  for (let day = 0; day < 7; day++) {
    const obsTime = new Date(baseTimestamp + (day * 86400 * 1000) + (12 * 3600 * 1000)).toISOString();
    const delay = Math.max(0, Math.round(t.delayMinutes + (Math.sin(day + parseInt(t.trainNumber.slice(-1))) * 15)));
    delayHistory.push({
      trainNumber: t.trainNumber,
      trainName: t.trainName,
      snapshotTimestamp: obsTime,
      observedDelayMinutes: delay,
      stationCode: t.currentLocation.stationCode,
      speedKmph: t.currentSpeedKmph,
      status: delay === 0 ? 'On Time' : `Delayed by ${delay}m`,
      dayOffset: day - 7
    });
  }
});

// --- 7. DISRUPTIONS & INCIDENTS (20 examples) ---
const disruptions = [
  {
    incidentId: 'INC-DCS-01',
    trainNumber: '12951',
    stationCode: 'KOTA',
    severity: 'WARNING',
    type: 'OVERHEAD_EQUIPMENT_MAINTENANCE',
    description: 'Scheduled 25kV traction power maintenance block in Kota division passing loop.',
    estimatedDelayMinutes: 25,
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    status: 'ACTIVE',
    dcsImpact: 'Queue accumulation on downstream block section'
  },
  {
    incidentId: 'INC-DCS-02',
    trainNumber: '12301',
    stationCode: 'CNB',
    severity: 'CRITICAL',
    type: 'AUTOMATED_SIGNALLING_INTERLOCKING',
    description: 'Electronic Interlocking circuit fail-safe lock engaged at Kanpur Central West cabin.',
    estimatedDelayMinutes: 45,
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    status: 'ACTIVE',
    dcsImpact: 'Route reservation blocked; manual pilot train protocol in effect'
  },
  {
    incidentId: 'INC-DCS-03',
    trainNumber: '22436',
    stationCode: 'PRYJ',
    severity: 'INFO',
    type: 'PLATFORM_REALLOCATION',
    description: 'Platform 1 occupied by delayed freight; rerouted to Platform 4.',
    estimatedDelayMinutes: 8,
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    status: 'ACTIVE',
    dcsImpact: 'Passenger information display system update sent'
  },
  {
    incidentId: 'INC-DCS-04',
    stationCode: 'NDLS',
    severity: 'CRITICAL',
    type: 'FOG_SPEED_RESTRICTION',
    description: 'Dense fog envelope in Northern corridor triggering 60 km/h fog safety limits.',
    estimatedDelayMinutes: 60,
    timestamp: new Date(Date.now() - 14400000).toISOString(),
    status: 'ACTIVE',
    dcsImpact: 'Network-wide timetable headways expanded from 3m to 8m'
  },
  {
    incidentId: 'INC-DCS-05',
    trainNumber: '12431',
    stationCode: 'RN',
    severity: 'WARNING',
    type: 'KONKAN_MONSOON_PATROLLING',
    description: 'Precautionary speed ceiling along cuttings and viaducts in Ratnagiri section.',
    estimatedDelayMinutes: 30,
    timestamp: new Date(Date.now() - 21600000).toISOString(),
    status: 'ACTIVE',
    dcsImpact: 'Deceleration buffer applied to arrival forecasts'
  },
  {
    incidentId: 'INC-DCS-06',
    trainNumber: '20607',
    stationCode: 'KPD',
    severity: 'INFO',
    type: 'ROLLING_STOCK_INSPECTION',
    description: 'Under-gear acoustic sensor health check completed successfully.',
    estimatedDelayMinutes: 4,
    timestamp: new Date(Date.now() - 5400000).toISOString(),
    status: 'RESOLVED',
    dcsImpact: 'Clearance transmitted to telemetry gateway'
  },
  {
    incidentId: 'INC-DCS-07',
    stationCode: 'BZA',
    severity: 'WARNING',
    type: 'LEVEL_CROSSING_GATE_FAILURE',
    description: 'Interlocked level crossing boom sensor error; manual hand-cranking engaged.',
    estimatedDelayMinutes: 18,
    timestamp: new Date(Date.now() - 9000000).toISOString(),
    status: 'ACTIVE',
    dcsImpact: 'Approaching rakes holding at outer home signals'
  },
  {
    incidentId: 'INC-DCS-08',
    trainNumber: '12839',
    stationCode: 'VSKP',
    severity: 'INFO',
    type: 'CREW_CHANGE_DELAY',
    description: 'Loco pilot changeover delayed due to inbound rake delayed turnaround.',
    estimatedDelayMinutes: 12,
    timestamp: new Date(Date.now() - 10800000).toISOString(),
    status: 'ACTIVE',
    dcsImpact: 'Distributed dispatch recalculated departure slot'
  },
  {
    incidentId: 'INC-DCS-09',
    stationCode: 'HWH',
    severity: 'WARNING',
    type: 'TERMINAL_YARD_CONGESTION',
    description: 'Heavy evening commuter dispatch wave causing outer yard queueing.',
    estimatedDelayMinutes: 22,
    timestamp: new Date(Date.now() - 12600000).toISOString(),
    status: 'ACTIVE',
    dcsImpact: 'Inbound trains held on third reception lines'
  },
  {
    incidentId: 'INC-DCS-10',
    trainNumber: '12137',
    stationCode: 'IGP',
    severity: 'INFO',
    type: 'GHAT_BANKER_ATTACHMENT',
    description: 'Banker locomotives attached at Igatpuri for Kasara ghat descent.',
    estimatedDelayMinutes: 5,
    timestamp: new Date(Date.now() - 16200000).toISOString(),
    status: 'RESOLVED',
    dcsImpact: 'Weight ratio verified by distributed brake computer'
  },
  {
    incidentId: 'INC-DCS-11',
    stationCode: 'BPL',
    severity: 'WARNING',
    type: 'TRACK_CIRCUIT_FLICKER',
    description: 'Bhopal yard track circuit #12 intermittent signal loss under rain.',
    estimatedDelayMinutes: 15,
    timestamp: new Date(Date.now() - 18000000).toISOString(),
    status: 'ACTIVE',
    dcsImpact: 'Automated axle counter backup took over instantly'
  },
  {
    incidentId: 'INC-DCS-12',
    trainNumber: '22691',
    stationCode: 'NGP',
    severity: 'INFO',
    type: 'CATERING_WATERING_HALT',
    description: 'Quick-watering pipeline filling for 22 LHB coaches.',
    estimatedDelayMinutes: 7,
    timestamp: new Date(Date.now() - 19800000).toISOString(),
    status: 'RESOLVED',
    dcsImpact: 'Service departure confirmed within timetable buffer'
  },
  {
    incidentId: 'INC-DCS-13',
    stationCode: 'GKP',
    severity: 'WARNING',
    type: 'PLATFORM_SURFACING_WORK',
    description: 'Platform 2 edge resurfacing ongoing; speed caution 15 km/h.',
    estimatedDelayMinutes: 10,
    timestamp: new Date(Date.now() - 23400000).toISOString(),
    status: 'ACTIVE',
    dcsImpact: 'Train berthing caution orders issued'
  },
  {
    incidentId: 'INC-DCS-14',
    trainNumber: '12925',
    stationCode: 'ST',
    severity: 'INFO',
    type: 'PARCEL_LOADING_EXCESS',
    description: 'Bulk parcel loading into front brake van.',
    estimatedDelayMinutes: 10,
    timestamp: new Date(Date.now() - 25200000).toISOString(),
    status: 'RESOLVED',
    dcsImpact: 'Departure timestamp logged in audit store'
  },
  {
    incidentId: 'INC-DCS-15',
    stationCode: 'LKO',
    severity: 'CRITICAL',
    type: 'WEATHER_THUNDERSTORM',
    description: 'High wind thunderstorm causing overhead tree branch hazard inspection.',
    estimatedDelayMinutes: 40,
    timestamp: new Date(Date.now() - 27000000).toISOString(),
    status: 'ACTIVE',
    dcsImpact: 'Power supply temporarily switched to alternate feeder'
  },
  {
    incidentId: 'INC-DCS-16',
    trainNumber: '12002',
    stationCode: 'AGC',
    severity: 'INFO',
    type: 'TOURIST_DEBOARDING',
    description: 'Large tourist contingent deboarding on Agra Cantt Platform 1.',
    estimatedDelayMinutes: 4,
    timestamp: new Date(Date.now() - 28800000).toISOString(),
    status: 'RESOLVED',
    dcsImpact: 'Platform dwell time recorded'
  },
  {
    incidentId: 'INC-DCS-17',
    stationCode: 'SBC',
    severity: 'INFO',
    type: 'PASSENGER_ALARM_CHAIN_PULL',
    description: 'Alarm chain reset on departing MEMU commuter train.',
    estimatedDelayMinutes: 6,
    timestamp: new Date(Date.now() - 30600000).toISOString(),
    status: 'RESOLVED',
    dcsImpact: 'Guard-driver radio protocol verified'
  },
  {
    incidentId: 'INC-DCS-18',
    trainNumber: '12267',
    stationCode: 'BRC',
    severity: 'INFO',
    type: 'FAST_CORRIDOR_GREEN_WAVE',
    description: 'Freight overtakes coordinated ahead at Vadodara bypass.',
    estimatedDelayMinutes: 0,
    timestamp: new Date(Date.now() - 32400000).toISOString(),
    status: 'ACTIVE',
    dcsImpact: 'Optimal slot assigned by automated traffic management'
  },
  {
    incidentId: 'INC-DCS-19',
    stationCode: 'RTM',
    severity: 'WARNING',
    type: 'POINT_MACHINE_LUBRICATION',
    description: 'Routine maintenance of turnout switch blades in yard.',
    estimatedDelayMinutes: 14,
    timestamp: new Date(Date.now() - 34200000).toISOString(),
    status: 'ACTIVE',
    dcsImpact: 'Alternative crossover line selected'
  },
  {
    incidentId: 'INC-DCS-20',
    trainNumber: '12801',
    stationCode: 'TATA',
    severity: 'WARNING',
    type: 'MINERAL_FREIGHT_CROSSING',
    description: 'Heavy iron ore rake crossing Diamond crossover at Tatanagar.',
    estimatedDelayMinutes: 16,
    timestamp: new Date(Date.now() - 36000000).toISOString(),
    status: 'ACTIVE',
    dcsImpact: 'Priority scheduler assigned passage within 12 minutes'
  }
];

// --- 8. ROUTES & TIMETABLES (134 route associations) ---
const routesData = fullTrains.map(t => ({
  trainNumber: t.trainNumber,
  trainName: t.trainName,
  origin: t.origin,
  destination: t.destination,
  totalDistanceKm: t.totalDistanceKm,
  totalDurationMinutes: t.totalDurationMinutes,
  haltsCount: t.route.length,
  routeStations: t.route.map(h => h.stationCode),
  orderedHalts: t.route
}));

const timetablesData = {};
fullTrains.forEach(t => {
  timetablesData[t.trainNumber] = {
    trainNumber: t.trainNumber,
    trainName: t.trainName,
    operatingDays: t.operatingDays,
    classes: t.classes,
    schedule: t.route.map(h => ({
      stationCode: h.stationCode,
      stationName: h.stationName,
      arrival: h.scheduledArrival,
      departure: h.scheduledDeparture,
      day: h.dayNumber,
      distanceKm: h.distanceKm,
      platform: h.platform
    }))
  };
});

// Write all fixtures to data/fixtures/
fs.writeFileSync(path.join(FIXTURES_DIR, 'stations.json'), JSON.stringify(enrichedStations, null, 2));
fs.writeFileSync(path.join(FIXTURES_DIR, 'trains.json'), JSON.stringify(fullTrains, null, 2));
fs.writeFileSync(path.join(FIXTURES_DIR, 'routes.json'), JSON.stringify(routesData, null, 2));
fs.writeFileSync(path.join(FIXTURES_DIR, 'timetables.json'), JSON.stringify(timetablesData, null, 2));
fs.writeFileSync(path.join(FIXTURES_DIR, 'live-status.json'), JSON.stringify(liveStatusRecords, null, 2));
fs.writeFileSync(path.join(FIXTURES_DIR, 'coach-layouts.json'), JSON.stringify(coachLayouts, null, 2));
fs.writeFileSync(path.join(FIXTURES_DIR, 'platform-positions.json'), JSON.stringify(platformPositions, null, 2));
fs.writeFileSync(path.join(FIXTURES_DIR, 'reservations.json'), JSON.stringify(reservationsFull, null, 2));
fs.writeFileSync(path.join(FIXTURES_DIR, 'suburban.json'), JSON.stringify(suburbanFull, null, 2));
fs.writeFileSync(path.join(FIXTURES_DIR, 'freight.json'), JSON.stringify(freightFull, null, 2));
fs.writeFileSync(path.join(FIXTURES_DIR, 'delay-history.json'), JSON.stringify(delayHistory, null, 2));
fs.writeFileSync(path.join(FIXTURES_DIR, 'disruptions.json'), JSON.stringify(disruptions, null, 2));

console.log('Successfully generated all fixtures:');
console.log(`- Stations: ${enrichedStations.length}`);
console.log(`- Trains: ${fullTrains.length}`);
console.log(`- Live-status tracks: ${Object.keys(liveStatusRecords).length}`);
console.log(`- Coach layouts: ${Object.keys(coachLayouts).length}`);
console.log(`- Platform positions: ${Object.keys(platformPositions).length}`);
console.log(`- Reservations: ${Object.keys(pnrExamples).length}`);
console.log(`- Suburban timetable services: ${suburbanFull.timetables.reduce((acc, t) => acc + t.services.length, 0)}`);
console.log(`- Freight rakes: ${freightFull.length}`);
console.log(`- Historical delay observations: ${delayHistory.length}`);
console.log(`- Disruptions & incidents: ${disruptions.length}`);
