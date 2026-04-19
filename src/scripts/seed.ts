import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase'; // Note: Ensure firebase.ts paths correctly resolve.

const FIRST_NAMES = ["Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Ayaan", "Krishna", "Ishaan", "Shaurya", "Atharva", "Ananya", "Diya", "Aditi", "Sara", "Riya", "Anika", "Nandini", "Sneha", "Neha", "Priya", "Rahul", "Vikram", "Raj", "Siddharth", "Pooja", "Aishwarya", "Kavya", "Varun", "Rohit"];
const LAST_NAMES = ["Sharma", "Verma", "Gupta", "Singh", "Kumar", "Patel", "Das", "Bose", "Reddy", "Rao", "Nair", "Iyer", "Chauhan", "Yadav", "Jain", "Mishra", "Pandey"];

const AREAS = [
  { id: 'aliganj', name: 'Aliganj', lat: 26.8922, lng: 80.9366 },
  { id: 'gomti-nagar', name: 'Gomti Nagar', lat: 26.8500, lng: 80.9900 },
  { id: 'indira-nagar', name: 'Indira Nagar', lat: 26.8833, lng: 80.9933 },
  { id: 'hazratganj', name: 'Hazratganj', lat: 26.8467, lng: 80.9462 },
  { id: 'chowk', name: 'Chowk', lat: 26.8700, lng: 80.9100 },
  { id: 'jankipuram', name: 'Jankipuram', lat: 26.9200, lng: 80.9400 }
];

const SKILLS = ['medical', 'logistics', 'search and rescue', 'communications', 'food distribution'];
const CATEGORIES = ['FOOD', 'MEDICAL', 'WATER', 'SHELTER', 'SECURITY'];
const STREETS = ["Main Road", "Sector 4", "Block B", "Ring Road", "Market Street", "Station Road", "Temple Lane"];

const randomElement = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomCoords = (baseLat: number, baseLng: number) => ({
  lat: baseLat + (Math.random() - 0.5) * 0.02,
  lng: baseLng + (Math.random() - 0.5) * 0.02
});

const generatePhone = () => `+91 ${randomInt(6, 9)}${Math.random().toString().slice(2, 11)}`;

async function seedDatabase() {
  console.log("Starting seed process...");

  // Generate 100 Volunteers
  const usersRef = collection(db, 'users');
  for (let i = 0; i < 100; i++) {
    const area = randomElement(AREAS);
    const firstName = randomElement(FIRST_NAMES);
    const lastName = randomElement(LAST_NAMES);
    const numSkills = randomInt(1, 3);
    const userSkills = [...SKILLS].sort(() => 0.5 - Math.random()).slice(0, numSkills);
    
    await addDoc(usersRef, {
      name: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randomInt(1,99)}@example.com`,
      role: 'volunteer',
      skills: userSkills,
      bio: `Dedicated volunteer based in ${area.name}, ready to help the community.`,
      status: 'active',
      coordinates: randomCoords(area.lat, area.lng),
      phone: generatePhone(),
      address: `${randomElement(STREETS)}, ${area.name}, Lucknow, UP`,
      availability: randomElement(['immediate', 'scheduled', 'on-call'])
    });
    console.log(`Added volunteer ${i + 1}/100`);
  }

  // Generate 100 Issues
  const issuesRef = collection(db, 'issues');
  for (let i = 0; i < 100; i++) {
    const area = randomElement(AREAS);
    const category = randomElement(CATEGORIES);
    const priority = randomElement(['HIGH', 'MED', 'LOW']);
    
    let title = "";
    let aiRec = "";
    
    switch(category) {
      case 'MEDICAL': title = "Medical emergency assistance needed"; aiRec = "Dispatch onsite medical triage team."; break;
      case 'FOOD': title = "Food distribution crisis"; aiRec = "Send emergency supply trucks to the location."; break;
      case 'WATER': title = "Clean water shortage"; aiRec = "Dispatch water tankers for community relief."; break;
      case 'SHELTER': title = "Temporary shelter needed"; aiRec = "Provide reinforced tents and community blankets."; break;
      case 'SECURITY': title = "Community safety concern"; aiRec = "Alert local neighborhood watch to monitor."; break;
    }

    await addDoc(issuesRef, {
      title: `${title} - ${area.name}`,
      location: `${randomElement(STREETS)}, ${area.name}`,
      areaId: area.id,
      peopleAffected: randomInt(10, 500),
      priority,
      category,
      aiRecommendation: aiRec,
      confidence: randomInt(75, 98),
      eta: `${randomInt(15, 60)} mins`,
      riskMessage: `Potential secondary risks if left unresolved for ${randomInt(2, 12)} hours.`,
      status: 'reported',
      coordinates: randomCoords(area.lat, area.lng),
      timestamp: new Date(Date.now() - randomInt(0, 86400000)).toISOString()
    });
    console.log(`Added issue ${i + 1}/100`);
  }

  console.log("✅ Seeding complete!");
  process.exit(0);
}

seedDatabase().catch(console.error);
