const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Comprehensive collection of church hymnals from various traditions
const hymnalSongs = [
  // === CLASSIC HYMNS (PUBLIC DOMAIN) ===
  {
    title: "Amazing Grace",
    artist: "Traditional",
    author: "John Newton",
    lyrics: `Verse 1:
Amazing grace, how sweet the sound
That saved a wretch like me
I once was lost, but now am found
Was blind, but now I see

Verse 2:
'Twas grace that taught my heart to fear
And grace my fears relieved
How precious did that grace appear
The hour I first believed

Verse 3:
Through many dangers, toils and snares
I have already come
'Tis grace hath brought me safe thus far
And grace will lead me home

Verse 4:
When we've been there ten thousand years
Bright shining as the sun
We've no less days to sing God's praise
Than when we first begun`,
    key: "G",
    tempo: "Slow",
    category: "Traditional Hymn",
    tags: ["Grace", "Salvation", "Traditional"],
    copyright: "Public Domain",
    ccliNumber: "22025",
    notes: "Most beloved hymn worldwide"
  },

  {
    title: "How Great Thou Art",
    artist: "Traditional",
    author: "Carl Gustav Boberg / Stuart K. Hine",
    lyrics: `Verse 1:
O Lord my God, when I in awesome wonder
Consider all the worlds Thy hands have made
I see the stars, I hear the rolling thunder
Thy power throughout the universe displayed

Chorus:
Then sings my soul, my Savior God, to Thee
How great Thou art, how great Thou art
Then sings my soul, my Savior God, to Thee
How great Thou art, how great Thou art

Verse 2:
When through the woods and forest glades I wander
And hear the birds sing sweetly in the trees
When I look down from lofty mountain grandeur
And hear the brook and feel the gentle breeze

Verse 3:
And when I think that God, His Son not sparing
Sent Him to die, I scarce can take it in
That on the cross, my burden gladly bearing
He bled and died to take away my sin

Verse 4:
When Christ shall come with shout of acclamation
And take me home, what joy shall fill my heart
Then I shall bow in humble adoration
And there proclaim, my God, how great Thou art`,
    key: "Bb",
    tempo: "Medium",
    category: "Traditional Hymn", 
    tags: ["Worship", "Creation", "Praise"],
    copyright: "Public Domain",
    ccliNumber: "14181",
    notes: "Swedish hymn translated to English"
  },

  {
    title: "Holy, Holy, Holy",
    artist: "Traditional",
    author: "Reginald Heber",
    lyrics: `Verse 1:
Holy, holy, holy! Lord God Almighty!
Early in the morning our song shall rise to Thee
Holy, holy, holy! Merciful and mighty!
God in three persons, blessed Trinity!

Verse 2:
Holy, holy, holy! All the saints adore Thee
Casting down their golden crowns around the glassy sea
Cherubim and seraphim falling down before Thee
Which wert and art and evermore shalt be

Verse 3:
Holy, holy, holy! Though the darkness hide Thee
Though the eye of sinful man Thy glory may not see
Only Thou art holy, there is none beside Thee
Perfect in power, in love, and purity

Verse 4:
Holy, holy, holy! Lord God Almighty!
All Thy works shall praise Thy name in earth and sky and sea
Holy, holy, holy! Merciful and mighty!
God in three persons, blessed Trinity!`,
    key: "Eb",
    tempo: "Medium",
    category: "Traditional Hymn",
    tags: ["Trinity", "Holiness", "Worship"],
    copyright: "Public Domain",
    ccliNumber: "1156",
    notes: "Classic Trinity hymn"
  },

  {
    title: "It Is Well With My Soul",
    artist: "Traditional",
    author: "Horatio G. Spafford",
    lyrics: `Verse 1:
When peace like a river attendeth my way
When sorrows like sea billows roll
Whatever my lot, Thou hast taught me to say
It is well, it is well with my soul

Chorus:
It is well with my soul
It is well, it is well with my soul

Verse 2:
Though Satan should buffet, though trials should come
Let this blest assurance control
That Christ hath regarded my helpless estate
And hath shed His own blood for my soul

Verse 3:
My sin, oh the bliss of this glorious thought
My sin, not in part but the whole
Is nailed to the cross, and I bear it no more
Praise the Lord, praise the Lord, O my soul

Verse 4:
And Lord, haste the day when the faith shall be sight
The clouds be rolled back as a scroll
The trump shall resound and the Lord shall descend
Even so, it is well with my soul`,
    key: "C", 
    tempo: "Medium",
    category: "Traditional Hymn",
    tags: ["Peace", "Faith", "Comfort"],
    copyright: "Public Domain",
    ccliNumber: "25376",
    notes: "Written after tragic family loss"
  },

  {
    title: "Great Is Thy Faithfulness",
    artist: "Traditional",  
    author: "Thomas Obadiah Chisholm",
    lyrics: `Verse 1:
Great is Thy faithfulness, O God my Father
There is no shadow of turning with Thee
Thou changest not, Thy compassions they fail not
As Thou hast been Thou forever wilt be

Chorus:
Great is Thy faithfulness!
Great is Thy faithfulness!
Morning by morning new mercies I see
All I have needed Thy hand hath provided
Great is Thy faithfulness, Lord unto me

Verse 2:
Summer and winter, and springtime and harvest
Sun, moon and stars in their courses above
Join with all nature in manifold witness
To Thy great faithfulness, mercy and love

Verse 3:
Pardon for sin and a peace that endureth
Thy own dear presence to cheer and to guide
Strength for today and bright hope for tomorrow
Blessings all mine, with ten thousand beside`,
    key: "D",
    tempo: "Medium", 
    category: "Traditional Hymn",
    tags: ["Faithfulness", "God's Character", "Provision"],
    copyright: "Public Domain",
    ccliNumber: "18723",
    notes: "Based on Lamentations 3:22-23"
  },

  {
    title: "Be Thou My Vision",
    artist: "Traditional",
    author: "Irish Traditional / Eleanor Hull",
    lyrics: `Verse 1:
Be Thou my vision, O Lord of my heart
Naught be all else to me, save that Thou art
Thou my best thought, by day or by night
Waking or sleeping, Thy presence my light

Verse 2:
Be Thou my wisdom, and Thou my true word
I ever with Thee and Thou with me, Lord
Thou my great Father, I Thy true son
Thou in me dwelling, and I with Thee one

Verse 3:
Be Thou my battle shield, sword for my fight
Be Thou my dignity, Thou my delight
Thou my soul's shelter, Thou my high tower
Raise Thou me heavenward, O Power of my power

Verse 4:
Riches I heed not, nor man's empty praise
Thou mine inheritance, now and always
Thou and Thou only, first in my heart
High King of Heaven, my treasure Thou art`,
    key: "F",
    tempo: "Medium",
    category: "Traditional Hymn",
    tags: ["Prayer", "Celtic", "Devotion"],
    copyright: "Public Domain", 
    ccliNumber: "30639",
    notes: "Ancient Irish hymn"
  },

  {
    title: "A Mighty Fortress Is Our God",
    artist: "Traditional",
    author: "Martin Luther",
    lyrics: `Verse 1:
A mighty fortress is our God
A bulwark never failing
Our helper He amid the flood
Of mortal ills prevailing
For still our ancient foe
Doth seek to work us woe
His craft and power are great
And armed with cruel hate
On earth is not his equal

Verse 2:
Did we in our own strength confide
Our striving would be losing
Were not the right man on our side
The man of God's own choosing
Dost ask who that may be?
Christ Jesus, it is He
Lord Sabaoth His name
From age to age the same
And He must win the battle

Verse 3:
And though this world with devils filled
Should threaten to undo us
We will not fear, for God hath willed
His truth to triumph through us
The Prince of Darkness grim
We tremble not for him
His rage we can endure
For lo, his doom is sure
One little word shall fell him

Verse 4:
That word above all earthly powers
No thanks to them abideth
The Spirit and the gifts are ours
Through Him who with us sideth
Let goods and kindred go
This mortal life also
The body they may kill
God's truth abideth still
His kingdom is forever`,
    key: "G",
    tempo: "Medium",
    category: "Traditional Hymn",
    tags: ["Reformation", "Strength", "Victory"],
    copyright: "Public Domain",
    ccliNumber: "20152",
    notes: "Martin Luther's Reformation anthem"
  },

  {
    title: "All Hail the Power of Jesus' Name",
    artist: "Traditional",
    author: "Edward Perronet",
    lyrics: `Verse 1:
All hail the power of Jesus' name!
Let angels prostrate fall
Bring forth the royal diadem
And crown Him Lord of all
Bring forth the royal diadem
And crown Him Lord of all

Verse 2:
Ye chosen seed of Israel's race
Ye ransomed from the fall
Hail Him who saves you by His grace
And crown Him Lord of all
Hail Him who saves you by His grace
And crown Him Lord of all

Verse 3:
Let every kindred, every tribe
On this terrestrial ball
To Him all majesty ascribe
And crown Him Lord of all
To Him all majesty ascribe
And crown Him Lord of all

Verse 4:
O that with yonder sacred throng
We at His feet may fall
We'll join the everlasting song
And crown Him Lord of all
We'll join the everlasting song
And crown Him Lord of all`,
    key: "A",
    tempo: "Medium",
    category: "Traditional Hymn",
    tags: ["Coronation", "Jesus", "Majesty"],
    copyright: "Public Domain",
    ccliNumber: "25400",
    notes: "Known as the 'Coronation Hymn'"
  },

  {
    title: "Rock of Ages",
    artist: "Traditional",
    author: "Augustus Toplady",
    lyrics: `Verse 1:
Rock of Ages, cleft for me
Let me hide myself in Thee
Let the water and the blood
From Thy wounded side which flowed
Be of sin the double cure
Save from wrath and make me pure

Verse 2:
Not the labors of my hands
Can fulfill Thy law's demands
Could my zeal no respite know
Could my tears forever flow
All for sin could not atone
Thou must save, and Thou alone

Verse 3:
Nothing in my hand I bring
Simply to the cross I cling
Naked, come to Thee for dress
Helpless, look to Thee for grace
Foul, I to the fountain fly
Wash me, Savior, or I die

Verse 4:
While I draw this fleeting breath
When mine eyes shall close in death
When I rise to worlds unknown
And behold Thee on Thy throne
Rock of Ages, cleft for me
Let me hide myself in Thee`,
    key: "G",
    tempo: "Slow",
    category: "Traditional Hymn",
    tags: ["Salvation", "Grace", "Cross"],
    copyright: "Public Domain",
    ccliNumber: "40588",
    notes: "Classic hymn of salvation by grace"
  },

  {
    title: "Crown Him with Many Crowns",
    artist: "Traditional",
    author: "Matthew Bridges",
    lyrics: `Verse 1:
Crown Him with many crowns
The Lamb upon His throne
Hark! How the heavenly anthem drowns
All music but its own
Awake, my soul, and sing
Of Him who died for thee
And hail Him as thy matchless King
Through all eternity

Verse 2:
Crown Him the Son of God
Before the worlds began
And ye who tread where He hath trod
Crown Him the Son of Man
Who every grief hath known
That wrings the human breast
And takes and bears them for His own
That all in Him may rest

Verse 3:
Crown Him the Lord of life
Who triumphed o'er the grave
And rose victorious in the strife
For those He came to save
His glories now we sing
Who died and rose on high
Who died eternal life to bring
And lives that death may die

Verse 4:
Crown Him the Lord of lords
Who over all doth reign
Who once on earth, the incarnate Word
For ransomed sinners slain
Now lives in realms of light
Where saints with angels sing
Their songs before Him day and night
Their God, Redeemer, King`,
    key: "D",
    tempo: "Medium",
    category: "Traditional Hymn",
    tags: ["Jesus", "Kingship", "Victory"],
    copyright: "Public Domain",
    ccliNumber: "23938",
    notes: "Majestic hymn of Christ's lordship"
  },

  // === CHRISTMAS HYMNS ===
  {
    title: "O Come, All Ye Faithful",
    artist: "Traditional",
    author: "John Francis Wade",
    lyrics: `Verse 1:
O come, all ye faithful
Joyful and triumphant
O come ye, O come ye to Bethlehem
Come and behold Him
Born the King of angels

Chorus:
O come, let us adore Him
O come, let us adore Him
O come, let us adore Him
Christ the Lord

Verse 2:
God of God
Light of Light
Lo, He abhors not the Virgin's womb
Very God
Begotten, not created

Verse 3:
Sing, choirs of angels
Sing in exultation
Sing, all ye citizens of heaven above
Glory to God
In the highest

Verse 4:
Yea, Lord, we greet Thee
Born this happy morning
Jesus, to Thee be glory given
Word of the Father
Now in flesh appearing`,
    key: "G",
    tempo: "Medium",
    category: "Christmas Hymn",
    tags: ["Christmas", "Nativity", "Adoration"],
    copyright: "Public Domain",
    ccliNumber: "31054",
    notes: "Classic Christmas carol"
  },

  {
    title: "Silent Night",
    artist: "Traditional",
    author: "Josef Mohr / Franz Gruber",
    lyrics: `Verse 1:
Silent night, holy night
All is calm, all is bright
Round yon virgin mother and child
Holy infant so tender and mild
Sleep in heavenly peace
Sleep in heavenly peace

Verse 2:
Silent night, holy night
Shepherds quake at the sight
Glories stream from heaven afar
Heavenly hosts sing alleluia
Christ the Savior is born
Christ the Savior is born

Verse 3:
Silent night, holy night
Son of God, love's pure light
Radiant beams from Thy holy face
With the dawn of redeeming grace
Jesus, Lord, at Thy birth
Jesus, Lord, at Thy birth`,
    key: "C",
    tempo: "Slow",
    category: "Christmas Hymn",
    tags: ["Christmas", "Peace", "Nativity"],
    copyright: "Public Domain",
    ccliNumber: "27862",
    notes: "Most famous Christmas carol worldwide"
  },

  {
    title: "Hark! The Herald Angels Sing",
    artist: "Traditional",
    author: "Charles Wesley",
    lyrics: `Verse 1:
Hark! The herald angels sing
Glory to the newborn King
Peace on earth and mercy mild
God and sinners reconciled
Joyful, all ye nations rise
Join the triumph of the skies
With the angelic host proclaim
Christ is born in Bethlehem

Chorus:
Hark! The herald angels sing
Glory to the newborn King

Verse 2:
Christ by highest heaven adored
Christ the everlasting Lord
Late in time behold Him come
Offspring of a virgin's womb
Veiled in flesh the Godhead see
Hail the incarnate Deity
Pleased as man with man to dwell
Jesus, our Emmanuel

Verse 3:
Hail the heaven-born Prince of Peace!
Hail the Sun of Righteousness!
Light and life to all He brings
Risen with healing in His wings
Mild He lays His glory by
Born that man no more may die
Born to raise the sons of earth
Born to give them second birth`,
    key: "F",
    tempo: "Medium",
    category: "Christmas Hymn",
    tags: ["Christmas", "Angels", "Incarnation"],
    copyright: "Public Domain",
    ccliNumber: "27738",
    notes: "Triumphant Christmas proclamation"
  },

  // === EASTER HYMNS ===
  {
    title: "Christ the Lord Is Risen Today",
    artist: "Traditional",
    author: "Charles Wesley",
    lyrics: `Verse 1:
Christ the Lord is risen today, Alleluia!
Earth and heaven in chorus say, Alleluia!
Raise your joys and triumphs high, Alleluia!
Sing, ye heavens, and earth reply, Alleluia!

Verse 2:
Love's redeeming work is done, Alleluia!
Fought the fight, the battle won, Alleluia!
Death in vain forbids Him rise, Alleluia!
Christ has opened paradise, Alleluia!

Verse 3:
Lives again our glorious King, Alleluia!
Where, O death, is now thy sting? Alleluia!
Once He died our souls to save, Alleluia!
Where's thy victory, boasting grave? Alleluia!

Verse 4:
Soar we now where Christ has led, Alleluia!
Following our exalted Head, Alleluia!
Made like Him, like Him we rise, Alleluia!
Ours the cross, the grave, the skies, Alleluia!`,
    key: "G",
    tempo: "Fast",
    category: "Easter Hymn",
    tags: ["Easter", "Resurrection", "Victory"],
    copyright: "Public Domain",
    ccliNumber: "22025",
    notes: "Joyful Easter celebration"
  },

  // === COMMUNION HYMNS ===
  {
    title: "When I Survey the Wondrous Cross",
    artist: "Traditional",
    author: "Isaac Watts",
    lyrics: `Verse 1:
When I survey the wondrous cross
On which the Prince of glory died
My richest gain I count but loss
And pour contempt on all my pride

Verse 2:
Forbid it, Lord, that I should boast
Save in the death of Christ my God
All the vain things that charm me most
I sacrifice them to His blood

Verse 3:
See from His head, His hands, His feet
Sorrow and love flow mingled down
Did e'er such love and sorrow meet
Or thorns compose so rich a crown

Verse 4:
Were the whole realm of nature mine
That were a present far too small
Love so amazing, so divine
Demands my soul, my life, my all`,
    key: "F",
    tempo: "Slow",
    category: "Communion Hymn",
    tags: ["Cross", "Sacrifice", "Love"],
    copyright: "Public Domain",
    ccliNumber: "23246",
    notes: "Classic communion meditation"
  },

  // === PRAISE & WORSHIP ===
  {
    title: "All Creatures of Our God and King",
    artist: "Traditional",
    author: "Francis of Assisi / William Draper",
    lyrics: `Verse 1:
All creatures of our God and King
Lift up your voice and with us sing
Alleluia! Alleluia!
Thou burning sun with golden beam
Thou silver moon with softer gleam
O praise Him! O praise Him!
Alleluia! Alleluia! Alleluia!

Verse 2:
Thou rushing wind that art so strong
Ye clouds that sail in heaven along
O praise Him! Alleluia!
Thou rising morn, in praise rejoice
Ye lights of evening, find a voice
O praise Him! O praise Him!
Alleluia! Alleluia! Alleluia!

Verse 3:
Thou flowing water, pure and clear
Make music for thy Lord to hear
Alleluia! Alleluia!
Thou fire so masterful and bright
That givest man both warmth and light
O praise Him! O praise Him!
Alleluia! Alleluia! Alleluia!

Verse 4:
Let all things their Creator bless
And worship Him in humbleness
O praise Him! Alleluia!
Praise, praise the Father, praise the Son
And praise the Spirit, Three in One
O praise Him! O praise Him!
Alleluia! Alleluia! Alleluia!`,
    key: "G",
    tempo: "Medium",
    category: "Praise Hymn",
    tags: ["Creation", "Praise", "All Nature"],
    copyright: "Public Domain",
    ccliNumber: "17069",
    notes: "Francis of Assisi's canticle"
  }
];

async function seedHymnalSongs() {
  console.log('🎵 Starting hymnal song seeding...');
  
  try {
    let successCount = 0;
    let errorCount = 0;

    for (const songData of hymnalSongs) {
      try {
        // Check if song already exists
        const existingSong = await prisma.song.findFirst({
          where: {
            title: songData.title,
            artist: songData.artist
          }
        });

        if (existingSong) {
          console.log(`⏭️  Skipping "${songData.title}" - already exists`);
          continue;
        }

        // Create the song
        await prisma.song.create({
          data: {
            title: songData.title,
            artist: songData.artist,
            author: songData.author,
            lyrics: songData.lyrics,
            key: songData.key,
            tempo: songData.tempo,
            category: songData.category,
            tags: JSON.stringify(songData.tags),
            copyright: songData.copyright,
            ccliNumber: songData.ccliNumber,
            notes: songData.notes,
            usageCount: Math.floor(Math.random() * 20), // Random usage for variety
            lastUsed: Math.random() > 0.5 ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) : null
          }
        });

        console.log(`✅ Created: "${songData.title}" by ${songData.artist}`);
        successCount++;
      } catch (error) {
        console.error(`❌ Error creating "${songData.title}":`, error.message);
        errorCount++;
      }
    }

    console.log('\n🎵 Hymnal seeding completed!');
    console.log(`✅ Successfully created: ${successCount} songs`);
    console.log(`❌ Errors: ${errorCount} songs`);
    
    // Show database statistics
    const totalSongs = await prisma.song.count();
    const categories = await prisma.song.groupBy({
      by: ['category'],
      _count: {
        category: true
      }
    });

    console.log(`\n📊 Database Statistics:`);
    console.log(`Total songs: ${totalSongs}`);
    console.log(`Categories:`);
    categories.forEach(cat => {
      console.log(`  - ${cat.category}: ${cat._count.category} songs`);
    });

  } catch (error) {
    console.error('❌ Fatal error during hymnal seeding:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  seedHymnalSongs()
    .then(() => {
      console.log('🎵 Hymnal seeding script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Hymnal seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedHymnalSongs }; 