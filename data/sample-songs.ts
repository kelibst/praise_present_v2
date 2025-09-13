interface Song {
  id: string;
  title: string;
  artist?: string;
  author: string;
  lyrics: string;
  chords?: string;
  key: string;
  tempo: string;
  category: string;
  copyright: string;
  ccliNumber?: string;
  tags: string[];
  notes?: string;
  verses?: SongVerse[];
}

interface SongVerse {
  id: string;
  type: 'verse' | 'chorus' | 'bridge' | 'tag' | 'intro' | 'outro';
  number?: number;
  lyrics: string;
  chords?: string;
}

export const sampleSongs: Song[] = [
  {
    id: 'song-1',
    title: 'Amazing Grace',
    artist: 'Traditional',
    author: 'John Newton',
    lyrics: `Amazing grace! How sweet the sound
That saved a wretch like me!
I once was lost, but now am found;
Was blind, but now I see.

'Twas grace that taught my heart to fear,
And grace my fears relieved;
How precious did that grace appear
The hour I first believed.

Through many dangers, toils, and snares,
I have already come;
'Tis grace hath brought me safe thus far,
And grace will lead me home.

The Lord has promised good to me,
His Word my hope secures;
He will my Shield and Portion be,
As long as life endures.`,
    chords: `G - G/B - C - G
Em - G - D - G
G - G/B - C - G
Em - D - G - G`,
    key: 'G',
    tempo: '72 BPM',
    category: 'Hymn',
    copyright: 'Public Domain',
    ccliNumber: '22025',
    tags: ['hymn', 'grace', 'salvation', 'traditional'],
    notes: 'Classic hymn, perfect for communion or altar call',
    verses: [
      {
        id: 'v1',
        type: 'verse',
        number: 1,
        lyrics: `Amazing grace! How sweet the sound
That saved a wretch like me!
I once was lost, but now am found;
Was blind, but now I see.`,
        chords: `G - G/B - C - G
Em - G - D - G
G - G/B - C - G
Em - D - G - G`
      },
      {
        id: 'v2',
        type: 'verse',
        number: 2,
        lyrics: `'Twas grace that taught my heart to fear,
And grace my fears relieved;
How precious did that grace appear
The hour I first believed.`
      },
      {
        id: 'v3',
        type: 'verse',
        number: 3,
        lyrics: `Through many dangers, toils, and snares,
I have already come;
'Tis grace hath brought me safe thus far,
And grace will lead me home.`
      },
      {
        id: 'v4',
        type: 'verse',
        number: 4,
        lyrics: `The Lord has promised good to me,
His Word my hope secures;
He will my Shield and Portion be,
As long as life endures.`
      }
    ]
  },
  {
    id: 'song-2',
    title: 'How Great Thou Art',
    artist: 'Traditional',
    author: 'Carl Boberg / Stuart K. Hine',
    lyrics: `O Lord my God, when I in awesome wonder
Consider all the worlds Thy hands have made
I see the stars, I hear the rolling thunder
Thy power throughout the universe displayed

Then sings my soul, my Savior God, to Thee
How great Thou art! How great Thou art!
Then sings my soul, my Savior God, to Thee
How great Thou art! How great Thou art!

When through the woods, and forest glades I wander
And hear the birds sing sweetly in the trees
When I look down, from lofty mountain grandeur
And hear the brook, and feel the gentle breeze

Then sings my soul, my Savior God, to Thee
How great Thou art! How great Thou art!
Then sings my soul, my Savior God, to Thee
How great Thou art! How great Thou art!`,
    key: 'G',
    tempo: '76 BPM',
    category: 'Hymn',
    copyright: '© 1953 S. K. Hine',
    ccliNumber: '14181',
    tags: ['hymn', 'worship', 'creation', 'praise'],
    notes: 'Beloved hymn of worship and praise',
    verses: [
      {
        id: 'v1',
        type: 'verse',
        number: 1,
        lyrics: `O Lord my God, when I in awesome wonder
Consider all the worlds Thy hands have made
I see the stars, I hear the rolling thunder
Thy power throughout the universe displayed`
      },
      {
        id: 'c1',
        type: 'chorus',
        lyrics: `Then sings my soul, my Savior God, to Thee
How great Thou art! How great Thou art!
Then sings my soul, my Savior God, to Thee
How great Thou art! How great Thou art!`
      },
      {
        id: 'v2',
        type: 'verse',
        number: 2,
        lyrics: `When through the woods, and forest glades I wander
And hear the birds sing sweetly in the trees
When I look down, from lofty mountain grandeur
And hear the brook, and feel the gentle breeze`
      }
    ]
  },
  {
    id: 'song-3',
    title: '10,000 Reasons (Bless the Lord)',
    artist: 'Matt Redman',
    author: 'Matt Redman / Jonas Myrin',
    lyrics: `Bless the Lord, O my soul, O my soul
Worship His holy name
Sing like never before, O my soul
I'll worship Your holy name

The sun comes up, it's a new day dawning
It's time to sing Your song again
Whatever may pass, and whatever lies before me
Let me be singing when the evening comes

Bless the Lord, O my soul, O my soul
Worship His holy name
Sing like never before, O my soul
I'll worship Your holy name

You're rich in love, and You're slow to anger
Your name is great, and Your heart is kind
For all Your goodness I will keep on singing
Ten thousand reasons for my heart to find`,
    key: 'G',
    tempo: '74 BPM',
    category: 'Contemporary',
    copyright: '© 2011 Thankyou Music',
    ccliNumber: '6016351',
    tags: ['contemporary', 'worship', 'praise', 'thanksgiving'],
    notes: 'Modern worship favorite, great for opening or closing',
    verses: [
      {
        id: 'c1',
        type: 'chorus',
        lyrics: `Bless the Lord, O my soul, O my soul
Worship His holy name
Sing like never before, O my soul
I'll worship Your holy name`
      },
      {
        id: 'v1',
        type: 'verse',
        number: 1,
        lyrics: `The sun comes up, it's a new day dawning
It's time to sing Your song again
Whatever may pass, and whatever lies before me
Let me be singing when the evening comes`
      },
      {
        id: 'v2',
        type: 'verse',
        number: 2,
        lyrics: `You're rich in love, and You're slow to anger
Your name is great, and Your heart is kind
For all Your goodness I will keep on singing
Ten thousand reasons for my heart to find`
      }
    ]
  },
  {
    id: 'song-4',
    title: 'Great Is Thy Faithfulness',
    artist: 'Traditional',
    author: 'Thomas O. Chisholm / William M. Runyan',
    lyrics: `Great is Thy faithfulness, O God my Father
There is no shadow of turning with Thee
Thou changest not, Thy compassions, they fail not
As Thou hast been, Thou forever will be

Great is Thy faithfulness! Great is Thy faithfulness!
Morning by morning new mercies I see
All I have needed Thy hand hath provided
Great is Thy faithfulness, Lord, unto me!

Summer and winter and springtime and harvest
Sun, moon and stars in their courses above
Join with all nature in manifold witness
To Thy great faithfulness, mercy and love`,
    key: 'Bb',
    tempo: '78 BPM',
    category: 'Hymn',
    copyright: '© 1923, Ren. 1951 Hope Publishing Company',
    ccliNumber: '18723',
    tags: ['hymn', 'faithfulness', 'mercy', 'traditional'],
    notes: 'Classic hymn of God\'s faithfulness'
  },
  {
    id: 'song-5',
    title: 'Way Maker',
    artist: 'Sinach',
    author: 'Osinachi Kalu Okoro Egbu',
    lyrics: `You are here, moving in our midst
I worship You, I worship You
You are here, working in this place
I worship You, I worship You
You are here, moving in our midst
I worship You, I worship You
You are here, working in this place
I worship You, I worship You

Way maker, miracle worker, promise keeper
Light in the darkness, my God, that is who You are
Way maker, miracle worker, promise keeper
Light in the darkness, my God, that is who You are

That is who You are, that is who You are
That is who You are, that is who You are`,
    key: 'Bb',
    tempo: '68 BPM',
    category: 'Contemporary',
    copyright: '© 2016 Sinach',
    ccliNumber: '7115744',
    tags: ['contemporary', 'worship', 'miracle', 'faith'],
    notes: 'Powerful contemporary worship song'
  }
];