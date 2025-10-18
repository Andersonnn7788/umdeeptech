// Test script to verify database connection and data fetching
// Run this in your browser console or as a separate test file

async function testDatabaseConnection() {
  console.log('🧪 Testing Database Connection...\n')
  
  try {
    // Test 1: Fetch all doctors
    console.log('1. Testing /api/doctors endpoint...')
    const doctorsResponse = await fetch('/api/doctors')
    if (doctorsResponse.ok) {
      const doctors = await doctorsResponse.json()
      console.log('✅ Doctors fetched successfully:', doctors.length, 'doctors found')
      console.log('Sample doctor:', doctors[0])
    } else {
      console.error('❌ Failed to fetch doctors:', doctorsResponse.status)
    }

    // Test 2: Fetch doctors by category
    console.log('\n2. Testing /api/doctors?category=Medical endpoint...')
    const medicalDoctorsResponse = await fetch('/api/doctors?category=Medical')
    if (medicalDoctorsResponse.ok) {
      const medicalDoctors = await medicalDoctorsResponse.json()
      console.log('✅ Medical doctors fetched successfully:', medicalDoctors.length, 'medical doctors found')
    } else {
      console.error('❌ Failed to fetch medical doctors:', medicalDoctorsResponse.status)
    }

    // Test 3: Fetch a single doctor by ID (you'll need to replace the ID)
    console.log('\n3. Testing /api/doctors/[id] endpoint...')
    const doctorsForId = await fetch('/api/doctors')
    if (doctorsForId.ok) {
      const allDoctors = await doctorsForId.json()
      if (allDoctors.length > 0) {
        const firstDoctorId = allDoctors[0].id
        const singleDoctorResponse = await fetch(`/api/doctors/${firstDoctorId}`)
        if (singleDoctorResponse.ok) {
          const singleDoctor = await singleDoctorResponse.json()
          console.log('✅ Single doctor fetched successfully:', singleDoctor.name)
        } else {
          console.error('❌ Failed to fetch single doctor:', singleDoctorResponse.status)
        }
      }
    }

    // Test 4: Fetch appointments
    console.log('\n4. Testing /api/appointments endpoint...')
    const appointmentsResponse = await fetch('/api/appointments')
    if (appointmentsResponse.ok) {
      const appointments = await appointmentsResponse.json()
      console.log('✅ Appointments fetched successfully:', appointments.length, 'appointments found')
      if (appointments.length > 0) {
        console.log('Sample appointment:', appointments[0])
      }
    } else {
      console.error('❌ Failed to fetch appointments:', appointmentsResponse.status)
    }

    // Test 5: Test upcoming appointments
    console.log('\n5. Testing /api/appointments?type=upcoming endpoint...')
    const upcomingResponse = await fetch('/api/appointments?type=upcoming')
    if (upcomingResponse.ok) {
      const upcoming = await upcomingResponse.json()
      console.log('✅ Upcoming appointments fetched successfully:', upcoming.length, 'upcoming appointments')
    } else {
      console.error('❌ Failed to fetch upcoming appointments:', upcomingResponse.status)
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error)
  }

  console.log('\n🏁 Database tests completed!')
}

// Instructions for running the test
console.log(`
📋 INSTRUCTIONS TO TEST YOUR DATABASE:

1. First, run the SQL schema in your Supabase dashboard:
   - Go to https://supabase.com/dashboard
   - Select your project
   - Go to SQL Editor
   - Copy and paste the content from lib/supabase/schema.sql
   - Execute the SQL

2. Make sure your .env.local file has the correct values:
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

3. Start your Next.js development server:
   npm run dev

4. Run this test by pasting it in your browser console on localhost:3000:
   testDatabaseConnection()

5. Or you can test individual endpoints in your browser:
   - http://localhost:3000/api/doctors
   - http://localhost:3000/api/appointments
`)

// Export the function for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testDatabaseConnection }
}