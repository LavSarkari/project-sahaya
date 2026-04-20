import { collection, doc, setDoc, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

// 50 hyper-realistic Indian crisis events with exact GPS coords
const REALISTIC_ISSUES = [
  { title: "Severe waterlogging after cloudbursts", loc: "Dharavi, Sion, Mumbai, Maharashtra", lat: 19.0430, lng: 72.8567, cat: "WATER", pri: "HIGH", rec: "Deploy 12 high-capacity dewatering pumps and NDRF inflatable boats for evacuation of low-lying shanties.", affected: 4200 },
  { title: "Morbi-style bridge cable snap warning", loc: "Ellis Bridge, Ahmedabad, Gujarat", lat: 23.0225, lng: 72.5714, cat: "SECURITY", pri: "HIGH", rec: "Immediate closure to vehicular traffic; deploy structural engineers for load-bearing assessment.", affected: 850 },
  { title: "Ammonia leak at cold storage unit", loc: "Bawana Industrial Area, North Delhi", lat: 28.7997, lng: 77.0652, cat: "MEDICAL", pri: "HIGH", rec: "Evacuate 2 km radius; HazMat team to neutralise ammonia cloud with water curtain.", affected: 3100 },
  { title: "Flash floods destroying apple orchards", loc: "NH-44, Anantnag, Jammu & Kashmir", lat: 33.7311, lng: 75.1487, cat: "SHELTER", pri: "HIGH", rec: "Airlift stranded orchard workers; set up 200 emergency tents at Pahalgam grounds.", affected: 620 },
  { title: "Shatabdi Express derailment near bridge", loc: "Kanpur Dehat, Uttar Pradesh", lat: 26.4499, lng: 80.3319, cat: "MEDICAL", pri: "HIGH", rec: "Deploy 25 ALS ambulances; Indian Railways rescue coach to be dispatched from Lucknow.", affected: 340 },
  { title: "Tea estate landslide burying workers", loc: "Munnar, Idukki, Kerala", lat: 10.0889, lng: 77.0595, cat: "SHELTER", pri: "HIGH", rec: "NDRF Team 9 with sniffer dogs; ground-penetrating radar for 3 buried structures.", affected: 85 },
  { title: "Acute diarrhoeal outbreak in relief camp", loc: "Salt Lake, Sector V, Kolkata, West Bengal", lat: 22.5726, lng: 88.4312, cat: "MEDICAL", pri: "HIGH", rec: "WHO ORS packets for 2000 people; quarantine ward in camp section C.", affected: 1800 },
  { title: "Supply convoy ambushed, rations looted", loc: "Zunheboto, Nagaland", lat: 25.9678, lng: 94.5154, cat: "FOOD", pri: "HIGH", rec: "IAF AN-32 airdrop of 10-tonne non-perishable ration packs; armed escort for next convoy.", affected: 5200 },
  { title: "Pine forest fire approaching habitation", loc: "Bhimtal Road, Nainital, Uttarakhand", lat: 29.3919, lng: 79.4542, cat: "SECURITY", pri: "HIGH", rec: "Mi-17 water-bomber sorties; fire line clearing by 200 SDRF personnel.", affected: 420 },
  { title: "Heatstroke casualties during outdoor event", loc: "Charminar, Hyderabad, Telangana", lat: 17.3616, lng: 78.4747, cat: "MEDICAL", pri: "MED", rec: "Deploy 8 mobile cooling vans with mist fans and IV saline stations.", affected: 310 },
  { title: "Mettur Dam spillway gate stuck open", loc: "Mettur, Salem, Tamil Nadu", lat: 11.8021, lng: 77.8016, cat: "WATER", pri: "HIGH", rec: "Downstream warning sirens activated; pre-position 30 NDRF boats in Erode district.", affected: 7500 },
  { title: "E. coli detected in Cauvery pipeline", loc: "Koramangala, Bengaluru, Karnataka", lat: 12.9352, lng: 77.6245, cat: "WATER", pri: "MED", rec: "BWSSB to halt Zone 3 supply; tanker fleet of 40 to distribute boiled water.", affected: 4500 },
  { title: "Aftershock collapses 12 buildings", loc: "Bhuj, Kutch, Gujarat", lat: 23.2507, lng: 69.6644, cat: "SHELTER", pri: "HIGH", rec: "Seismic survey drones; thermal imaging to locate survivors under rubble.", affected: 2200 },
  { title: "Avalanche buries Atal Tunnel approach", loc: "Rohtang, Kullu, Himachal Pradesh", lat: 32.3716, lng: 77.2466, cat: "SECURITY", pri: "HIGH", rec: "Army HAWS platoon with thermal probes; IAF Dhruv choppers for casualty evacuation.", affected: 150 },
  { title: "Myanmar refugees need urgent shelter", loc: "Moreh, Tengnoupal, Manipur", lat: 24.2547, lng: 94.3039, cat: "SHELTER", pri: "HIGH", rec: "UNHCR tents for 800 families; portable latrines and community water purifiers.", affected: 3400 },
  { title: "Tornado flattens paddy fields", loc: "Paschim Medinipur, West Bengal", lat: 22.4257, lng: 87.3199, cat: "FOOD", pri: "MED", rec: "Crop damage assessment team; distribute emergency seed kits for resowing.", affected: 1600 },
  { title: "ICU oxygen pipeline failure", loc: "Rajiv Gandhi Govt Hospital, Chennai", lat: 13.0850, lng: 80.2756, cat: "MEDICAL", pri: "HIGH", rec: "Procure 50 D-type oxygen cylinders from nearest depot; repair pipeline within 4 hours.", affected: 120 },
  { title: "Mass food poisoning at wedding", loc: "Pushkar, Ajmer, Rajasthan", lat: 26.4883, lng: 74.5511, cat: "MEDICAL", pri: "HIGH", rec: "Gastric lavage kits and activated charcoal for 200; food samples to lab.", affected: 380 },
  { title: "Road caving in over old drainage", loc: "Anna Salai, Chennai, Tamil Nadu", lat: 13.0604, lng: 80.2608, cat: "SECURITY", pri: "MED", rec: "500 m cordon; geotech engineers to assess sewer infrastructure collapse.", affected: 90 },
  { title: "Chlorine gas tanker overturns on highway", loc: "NH-48, Manesar, Haryana", lat: 28.3595, lng: 76.9366, cat: "MEDICAL", pri: "HIGH", rec: "CBRN unit with breathing apparatus; hospitals on mass-casualty standby.", affected: 2700 },
  { title: "Stampede at Mahakumbh bathing ghat", loc: "Sangam, Prayagraj, Uttar Pradesh", lat: 25.4270, lng: 81.8854, cat: "MEDICAL", pri: "HIGH", rec: "Open 6 emergency exit corridors; deploy crowd-density drones with PA systems.", affected: 890 },
  { title: "Cloudburst triggers mudflow towards temple", loc: "Kedarnath, Rudraprayag, Uttarakhand", lat: 30.7352, lng: 79.0669, cat: "SHELTER", pri: "HIGH", rec: "Heli-evacuate 500 stranded pilgrims; gabion wall reinforcement upstream.", affected: 2100 },
  { title: "Cyclone Remal making landfall", loc: "Puri Beach, Odisha", lat: 19.7983, lng: 85.8245, cat: "SHELTER", pri: "HIGH", rec: "Mandatory evacuation to 47 cyclone shelters; fishing fleet recalled to harbour.", affected: 8400 },
  { title: "Ganga breaches danger mark at ghats", loc: "Assi Ghat, Varanasi, UP", lat: 25.2820, lng: 83.0036, cat: "WATER", pri: "HIGH", rec: "Distribute 3000 life jackets; move 12 ghat-side families to elevated camps.", affected: 1400 },
  { title: "Paint factory fire with toxic fumes", loc: "Okhla Industrial Area, South Delhi", lat: 28.5285, lng: 77.2798, cat: "SECURITY", pri: "MED", rec: "15 fire tenders with foam units; N95 masks for 1 km radius residents.", affected: 650 },
  { title: "Severe malnutrition in Adivasi hamlet", loc: "Narayanpur, Bastar, Chhattisgarh", lat: 19.7344, lng: 81.2482, cat: "FOOD", pri: "HIGH", rec: "ICDS emergency nutrition drive; therapeutic food supply for 300 children.", affected: 430 },
  { title: "Heritage chawl partial collapse", loc: "Bhendi Bazaar, South Mumbai, Maharashtra", lat: 18.9555, lng: 72.8335, cat: "SHELTER", pri: "HIGH", rec: "GPR scanning for trapped residents; temporary housing for 60 displaced families.", affected: 240 },
  { title: "Unexploded shell found near school", loc: "Tarn Taran, Punjab", lat: 31.4502, lng: 74.9317, cat: "SECURITY", pri: "HIGH", rec: "Army Bomb Disposal Squad; evacuate 500 m radius including 2 schools.", affected: 1200 },
  { title: "Oil tanker spill contaminating coast", loc: "Ennore Creek, Chennai, Tamil Nadu", lat: 13.2435, lng: 80.3278, cat: "WATER", pri: "MED", rec: "Deploy oil-skimming boats and sorbent booms; fishing ban in 5 km zone.", affected: 3500 },
  { title: "Tsunami early warning activated", loc: "Marina Beach, Chennai, Tamil Nadu", lat: 13.0499, lng: 80.2824, cat: "SECURITY", pri: "HIGH", rec: "Evacuate 1 km coastal strip; activate all 47 Chennai tsunami sirens.", affected: 1500 },
  { title: "Tanker train water delivery delayed", loc: "Latur, Maharashtra", lat: 18.4088, lng: 76.5604, cat: "WATER", pri: "MED", rec: "Coordinate emergency Jaldoot water train from Miraj; ration supply to 10L per family.", affected: 2800 },
  { title: "30-vehicle pileup in dense fog", loc: "Yamuna Expressway, Greater Noida, UP", lat: 28.4744, lng: 77.5040, cat: "MEDICAL", pri: "HIGH", rec: "Golden-hour ambulance fleet; highway patrol to manage secondary collision risk.", affected: 78 },
  { title: "Dengue fever cluster in urban slum", loc: "Seelampur, North East Delhi", lat: 28.6856, lng: 77.2662, cat: "MEDICAL", pri: "HIGH", rec: "Mass fogging drive; fever clinics with platelet testing for 5000 households.", affected: 6200 },
  { title: "Brahmaputra floods isolate river island", loc: "Majuli Island, Jorhat, Assam", lat: 26.9458, lng: 94.1706, cat: "FOOD", pri: "HIGH", rec: "IAF C-130J airdrop of 500 food parcels; water purification tablets for 10 villages.", affected: 1700 },
  { title: "Illegal coal mine cave-in", loc: "Dhanbad, Jharkhand", lat: 23.7915, lng: 86.4304, cat: "SECURITY", pri: "HIGH", rec: "Mines Rescue station team with cage rescue; compressed air line to trapped miners.", affected: 35 },
  { title: "Migrant workers stranded without wages", loc: "Surat Textile Market, Gujarat", lat: 21.1702, lng: 72.8311, cat: "FOOD", pri: "MED", rec: "Open community langars for 5000; coordinate with Labour Commissioner for wage release.", affected: 4800 },
  { title: "Communal clashes, shops set ablaze", loc: "Jawan Chauraha, Aligarh, UP", lat: 27.8974, lng: 78.0880, cat: "SECURITY", pri: "HIGH", rec: "Deploy RAF companies; impose Section 144; establish peace committee.", affected: 900 },
  { title: "Country boat capsizes with passengers", loc: "Brahmaputra, Guwahati, Assam", lat: 26.1834, lng: 91.7371, cat: "SECURITY", pri: "HIGH", rec: "NDRF riverine search with side-scan sonar; 8 rescue dinghies launched.", affected: 45 },
  { title: "Wild elephant herd enters town", loc: "Sulthan Bathery, Wayanad, Kerala", lat: 11.6585, lng: 76.2557, cat: "SECURITY", pri: "MED", rec: "Forest Dept kumki elephants for herding; ban firecrackers in 3 km zone.", affected: 280 },
  { title: "Desert locust swarm destroying crop", loc: "Jaisalmer, Rajasthan", lat: 26.9157, lng: 70.9083, cat: "FOOD", pri: "MED", rec: "Drone-based targeted pesticide spraying; crop insurance fast-track for 400 farmers.", affected: 2100 },
  { title: "Ambulance stuck in 3-hour traffic jam", loc: "Silk Board Junction, Bengaluru, Karnataka", lat: 12.9176, lng: 77.6234, cat: "MEDICAL", pri: "HIGH", rec: "Traffic police green corridor; consider helicopter evacuation for critical patient.", affected: 3 },
  { title: "Airport terminal false ceiling collapse", loc: "Lohegaon Airport, Pune, Maharashtra", lat: 18.5822, lng: 73.9197, cat: "MEDICAL", pri: "MED", rec: "Evacuate Terminal 1; structural audit before reopening; triage for 20 injured.", affected: 2500 },
  { title: "Bomb threat call at shopping mall", loc: "Phoenix Marketcity, Kurla, Mumbai", lat: 19.0833, lng: 72.8872, cat: "SECURITY", pri: "HIGH", rec: "Force One and BDS sweep; controlled evacuation via emergency stairwells.", affected: 6000 },
  { title: "High-rise residential fire, lifts disabled", loc: "DLF Cyber City, Gurugram, Haryana", lat: 28.4950, lng: 77.0895, cat: "SHELTER", pri: "HIGH", rec: "Deploy 90 m aerial ladder; rooftop helicopter pickup for upper floors.", affected: 350 },
  { title: "6.2 magnitude earthquake aftershocks", loc: "MG Marg, Gangtok, Sikkim", lat: 27.3314, lng: 88.6138, cat: "SHELTER", pri: "HIGH", rec: "Evacuate all multi-storey buildings; NDMA rapid assessment teams deployed.", affected: 1800 },
  { title: "Suburban train stuck in chest-deep water", loc: "Badlapur Station, Thane, Maharashtra", lat: 19.1604, lng: 73.2372, cat: "FOOD", pri: "MED", rec: "NDRF boats with biscuit packets and water; Railways rescue ART from Kalyan.", affected: 1200 },
  { title: "Heavy snow traps army and civilian vehicles", loc: "Zojila Pass, Kargil, Ladakh", lat: 34.2823, lng: 75.4893, cat: "MEDICAL", pri: "HIGH", rec: "BRO snow clearance team; hypothermia treatment kits for 200 stranded.", affected: 180 },
  { title: "AQI crosses 900, visibility near zero", loc: "Anand Vihar, East Delhi", lat: 28.6479, lng: 77.3197, cat: "MEDICAL", pri: "HIGH", rec: "Close schools; distribute N95 masks to 50000 households; mobile clean-air shelters.", affected: 8000 },
  { title: "Hospital oxygen plant failure", loc: "MY Hospital, Indore, Madhya Pradesh", lat: 22.7156, lng: 75.8677, cat: "MEDICAL", pri: "HIGH", rec: "Emergency LMO tanker from Dewas; manual bag ventilation for 40 ICU patients.", affected: 200 },
  { title: "Refinery pipeline explosion", loc: "BPCL Kochi Refinery, Ernakulam, Kerala", lat: 9.9472, lng: 76.3688, cat: "SECURITY", pri: "HIGH", rec: "Emergency valve shutoff; Class B foam suppression; evacuate within 3 km radius.", affected: 4500 },
];

const FIRST_NAMES = ["Aarav","Vivaan","Aditya","Vihaan","Arjun","Sai","Ayaan","Krishna","Ishaan","Shaurya","Atharva","Ananya","Diya","Aditi","Sara","Riya","Anika","Nandini","Sneha","Neha","Priya","Rahul","Vikram","Raj","Siddharth","Pooja","Aishwarya","Kavya","Varun","Rohit","Surya","Vijay","Aisha","Fatimah","Karthik","Ravi","Manoj","Pradeep","Anita","Divya"];
const LAST_NAMES = ["Sharma","Verma","Gupta","Singh","Kumar","Patel","Das","Bose","Reddy","Rao","Nair","Iyer","Chauhan","Yadav","Jain","Mishra","Pandey","Iqbal","Menon","Desai","Rathore","Kapoor","Chatterjee","Banerjee","Mehta","Naidu","Sen"];
const SKILLS = ["medical","logistics","search and rescue","communications","food distribution"];

const pick = (a: any[]) => a[Math.floor(Math.random() * a.length)];
const rint = (lo: number, hi: number) => Math.floor(Math.random() * (hi - lo + 1)) + lo;
const phone = () => `+91 ${rint(6,9)}${Math.random().toString().slice(2,11)}`;

export async function runSeeder() {
  if (!confirm("This will seed 50 realistic issues + 50 volunteers across India. Safe to re-run (overwrites, no duplicates). Continue?")) return;
  
  console.log("Starting seed...");

  try {
    // Seed 50 volunteers (deterministic IDs — re-running overwrites, no duplicates)
    const usersRef = collection(db, 'users');
    for (let i = 0; i < REALISTIC_ISSUES.length; i++) {
      const issue = REALISTIC_ISSUES[i];
      const fn = FIRST_NAMES[i % FIRST_NAMES.length], ln = LAST_NAMES[i % LAST_NAMES.length];
      const numSkills = (i % 3) + 2;
      const sk = [...SKILLS].sort(() => 0.5 - Math.random()).slice(0, numSkills);
      const uid = `seed-vol-${String(i).padStart(3, '0')}`;
      
      await setDoc(doc(usersRef, uid), {
        uid: uid,
        name: `${fn} ${ln}`,
        email: `${fn.toLowerCase()}.${ln.toLowerCase()}${i + 1}@volunteer.org`,
        role: "volunteer",
        skills: sk,
        bio: `Experienced crisis responder based near ${issue.loc.split(",")[0]}. Ready for immediate deployment.`,
        status: "active",
        coordinates: { lat: issue.lat + (Math.random()-0.5)*0.04, lng: issue.lng + (Math.random()-0.5)*0.04 },
        phone: phone(),
        address: issue.loc,
        availability: (["immediate","scheduled","on-call"] as const)[i % 3],
      });
      if (i % 10 === 0) console.log(`Volunteers: ${i}/${REALISTIC_ISSUES.length}`);
    }
    console.log("✅ All 50 volunteers seeded!");

    // Seed 50 issues (deterministic IDs — re-running overwrites, no duplicates)
    const issuesRef = collection(db, 'issues');
    for (let i = 0; i < REALISTIC_ISSUES.length; i++) {
      const is = REALISTIC_ISSUES[i];
      const issueId = `seed-issue-${String(i).padStart(3, '0')}`;
      const areaId = is.loc.split(",").pop()!.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

      await setDoc(doc(issuesRef, issueId), {
        title: is.title,
        location: is.loc,
        areaId: areaId,
        peopleAffected: is.affected,
        priority: is.pri,
        category: is.cat,
        aiRecommendation: is.rec,
        confidence: parseFloat((Math.random() * 0.15 + 0.85).toFixed(2)),
        eta: `${rint(20, 120)} mins`,
        riskMessage: `Situation may escalate critically if response is delayed beyond ${rint(1, 4)} hours.`,
        status: "reported",
        coordinates: { lat: is.lat, lng: is.lng },
        timestamp: new Date(Date.now() - rint(0, 7200000)).toISOString(),
      });
      if (i % 10 === 0) console.log(`Issues: ${i}/${REALISTIC_ISSUES.length}`);
    }

    console.log("✅ All 50 issues seeded!");

    // Seed Resources for Logistics Hub
    const resourcesRef = collection(db, 'resources');
    const resourceCategories = ['FOOD', 'MEDICAL', 'WATER', 'SHELTER'] as const;
    const resourceNames = {
      'FOOD': ['Emergency Rations', 'Meal Kits', 'Baby Food'],
      'MEDICAL': ['Trauma Kits', 'Insulin Supplies', 'Antibiotics'],
      'WATER': ['Bottled Water', 'Purification Tablets', 'Water Tanks'],
      'SHELTER': ['Blankets', 'Tents', 'Sleeping Bags']
    };

    const uniqueAreas = Array.from(new Set(REALISTIC_ISSUES.map(is => is.loc.split(",").pop()!.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""))));

    for (const area of uniqueAreas) {
      for (const cat of resourceCategories) {
        const name = pick(resourceNames[cat]);
        const resId = `res-${area}-${cat.toLowerCase()}`;
        await setDoc(doc(resourcesRef, resId), {
          name,
          category: cat,
          areaId: area,
          quantity: rint(50, 500),
          threshold: rint(100, 200),
          lastUpdated: serverTimestamp()
        });
      }
    }
    console.log("✅ Logistics resources seeded!");
    alert("✅ Successfully seeded 50 crisis events + 50 volunteers + logistics resources!");
  } catch (err: any) {
    console.error("Seed error:", err);
    alert(`Seeding failed: ${err.message}`);
  }
}
