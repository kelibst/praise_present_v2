const { PrismaClient } = require('@prisma/client');

const db = new PrismaClient();

const sampleSongs = [
  {
    title: "Amazing Grace",
    artist: "John Newton",
    author: "John Newton",
    lyrics: `Verse 1:
Amazing grace how sweet the sound
That saved a wretch like me
I once was lost but now am found
Was blind but now I see

Verse 2:
'Twas grace that taught my heart to fear
And grace my fears relieved
How precious did that grace appear
The hour I first believed

Verse 3:
Through many dangers toils and snares
I have already come
'Tis grace hath brought me safe thus far
And grace will lead me home

Verse 4:
When we've been there ten thousand years
Bright shining as the sun
We've no less days to sing God's praise
Than when we first begun`,
    ccliNumber: "22025",
    key: "G",
    tempo: "Medium",
    category: "Traditional",
    copyright: "Public Domain",
    tags: JSON.stringify(["classic", "hymn", "grace", "salvation"]),
    notes: "Classic hymn, very well known",
  },
  {
    title: "How Great Is Our God",
    artist: "Chris Tomlin",
    author: "Chris Tomlin, Jesse Reeves, Ed Cash",
    lyrics: `Verse 1:
The splendor of the King
Clothed in majesty
Let all the earth rejoice
All the earth rejoice

He wraps himself in light
And darkness tries to hide
And trembles at His voice
And trembles at His voice

Chorus:
How great is our God
Sing with me
How great is our God
And all will see how great
How great is our God

Verse 2:
And age to age He stands
And time is in His hands
Beginning and the End
Beginning and the End

The Godhead three in one
Father Spirit Son
The Lion and the Lamb
The Lion and the Lamb

Bridge:
Name above all names
Worthy of all praise
My heart will sing
How great is our God`,
    ccliNumber: "4348399",
    key: "A",
    tempo: "Medium",
    category: "Contemporary",
    copyright: "2004 Vamos Publishing",
    tags: JSON.stringify(["contemporary", "worship", "praise", "popular"]),
    notes: "Very popular contemporary worship song",
  },
  {
    title: "Holy Holy Holy",
    artist: "Reginald Heber",
    author: "Reginald Heber, John B. Dykes",
    lyrics: `Verse 1:
Holy holy holy
Lord God Almighty
Early in the morning
Our song shall rise to Thee

Holy holy holy
Merciful and mighty
God in three persons
Blessed Trinity

Verse 2:
Holy holy holy
All the saints adore Thee
Casting down their golden crowns
Around the glassy sea

Cherubim and seraphim
Falling down before Thee
Which wert and art
And evermore shalt be

Verse 3:
Holy holy holy
Though the darkness hide Thee
Though the eye of sinful man
Thy glory may not see

Only Thou art holy
There is none beside Thee
Perfect in power
In love and purity

Verse 4:
Holy holy holy
Lord God Almighty
All Thy works shall praise Thy name
In earth and sky and sea

Holy holy holy
Merciful and mighty
God in three persons
Blessed Trinity`,
    ccliNumber: "1156",
    key: "Bb",
    tempo: "Slow",
    category: "Traditional",
    copyright: "Public Domain",
    tags: JSON.stringify(["traditional", "hymn", "trinity", "holiness"]),
    notes: "Classic Trinity hymn",
  },
  {
    title: "10,000 Reasons (Bless the Lord)",
    artist: "Matt Redman",
    author: "Matt Redman, Jonas Myrin",
    lyrics: `Chorus:
Bless the Lord O my soul
O my soul
Worship His holy name
Sing like never before
O my soul
I'll worship Your holy name

Verse 1:
The sun comes up it's a new day dawning
It's time to sing Your song again
Whatever may pass and whatever lies before me
Let me be singing when the evening comes

Verse 2:
You're rich in love and You're slow to anger
Your name is great and Your heart is kind
For all Your goodness I'll keep on singing
Ten thousand reasons for my heart to find

Verse 3:
And on that day when my strength is failing
The end draws near and my time has come
Still my soul will sing Your praise unending
Ten thousand years and then forevermore`,
    ccliNumber: "6016351",
    key: "C",
    tempo: "Medium",
    category: "Contemporary",
    copyright: "2011 Thankyou Music",
    tags: JSON.stringify(["contemporary", "worship", "praise", "popular", "matt redman"]),
    notes: "Very popular contemporary worship song",
  },
  {
    title: "Great Are You Lord",
    artist: "All Sons & Daughters",
    author: "David Leonard, Jason Ingram, Leslie Jordan",
    lyrics: `Verse:
You give life You are love
You bring light to the darkness
You give hope You restore
Every heart that is broken

Great are You Lord

Chorus:
It's Your breath in our lungs
So we pour out our praise
We pour out our praise
It's Your breath in our lungs
So we pour out our praise to You only

Bridge:
All the earth will shout Your praise
Our hearts will cry these bones will sing
Great are You Lord`,
    ccliNumber: "6460220",
    key: "A",
    tempo: "Medium",
    category: "Contemporary",
    copyright: "2012 All Sons & Daughters",
    tags: JSON.stringify(["contemporary", "worship", "praise", "all sons and daughters"]),
    notes: "Popular contemporary worship song",
  }
];

async function seedSongs() {
  try {
    console.log('Starting song seeding...');

    // Clear existing songs
    await db.song.deleteMany();
    console.log('Cleared existing songs');

    // Insert sample songs
    for (const song of sampleSongs) {
      const created = await db.song.create({
        data: song
      });
      console.log(`Created song: ${created.title}`);
    }

    console.log(`Successfully seeded ${sampleSongs.length} songs`);
  } catch (error) {
    console.error('Error seeding songs:', error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  seedSongs()
    .then(() => {
      console.log('Song seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Song seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedSongs, sampleSongs }; 