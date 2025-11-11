import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function setupStorage() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  console.log('Setting up Supabase Storage...')

  // Create user-uploads bucket
  const { data: bucket, error: bucketError } = await supabase.storage.createBucket('user-uploads', {
    public: true,
    fileSizeLimit: 5242880, // 5MB
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
  })

  if (bucketError) {
    if (bucketError.message.includes('already exists')) {
      console.log('✓ Bucket "user-uploads" already exists')
    } else {
      console.error('Error creating bucket:', bucketError)
      process.exit(1)
    }
  } else {
    console.log('✓ Created bucket "user-uploads"')
  }

  console.log('\nStorage setup complete!')
}

setupStorage().catch(console.error)
