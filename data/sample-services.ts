export interface ServiceItem {
  id: string;
  type: 'scripture' | 'song' | 'announcement' | 'media';
  title: string;
  content: any;
  duration?: number;
  order: number;
}

export interface Service {
  id: string;
  name: string;
  date: string;
  startTime: string;
  endTime?: string;
  items: ServiceItem[];
  notes?: string;
}

export const sampleServices: Service[] = [
  {
    id: 'service-1',
    name: 'Sunday Morning Worship',
    date: '2024-01-14',
    startTime: '10:00 AM',
    endTime: '11:30 AM',
    notes: 'Regular Sunday worship service',
    items: [
      {
        id: 'item-1',
        type: 'song',
        title: 'Amazing Grace',
        content: {
          id: 'song-1',
          title: 'Amazing Grace',
          author: 'John Newton',
          lyrics: `Amazing grace! How sweet the sound
That saved a wretch like me!
I once was lost, but now am found;
Was blind, but now I see.

'Twas grace that taught my heart to fear,
And grace my fears relieved;
How precious did that grace appear
The hour I first believed.

Through many dangers, toils and snares,
I have already come;
'Tis grace hath brought me safe thus far,
And grace will lead me home.`,
          key: 'G',
          tempo: 72,
          ccliNumber: '22025'
        },
        duration: 300,
        order: 1
      },
      {
        id: 'item-2',
        type: 'scripture',
        title: 'John 3:16-17',
        content: {
          verses: [
            {
              id: 'verse-1',
              book: 'John',
              chapter: 3,
              verse: 16,
              text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.',
              translation: 'KJV'
            },
            {
              id: 'verse-2',
              book: 'John',
              chapter: 3,
              verse: 17,
              text: 'For God sent not his Son into the world to condemn the world; but that the world through him might be saved.',
              translation: 'KJV'
            }
          ]
        },
        duration: 120,
        order: 2
      },
      {
        id: 'item-3',
        type: 'announcement',
        title: 'Youth Group Meeting',
        content: {
          title: 'Youth Group Meeting',
          message: 'Join us this Friday at 7:00 PM for youth group activities and fellowship.',
          date: 'Friday, January 19th',
          time: '7:00 PM',
          location: 'Fellowship Hall',
          urgency: 'normal',
          details: 'All teens ages 13-18 are welcome. Snacks will be provided.'
        },
        duration: 60,
        order: 3
      },
      {
        id: 'item-4',
        type: 'scripture',
        title: 'Psalm 23:1-4',
        content: {
          verses: [
            {
              id: 'verse-3',
              book: 'Psalm',
              chapter: 23,
              verse: 1,
              text: 'The LORD is my shepherd; I shall not want.',
              translation: 'KJV'
            },
            {
              id: 'verse-4',
              book: 'Psalm',
              chapter: 23,
              verse: 2,
              text: 'He maketh me to lie down in green pastures: he leadeth me beside the still waters.',
              translation: 'KJV'
            },
            {
              id: 'verse-5',
              book: 'Psalm',
              chapter: 23,
              verse: 3,
              text: 'He restoreth my soul: he leadeth me in the paths of righteousness for his name\'s sake.',
              translation: 'KJV'
            },
            {
              id: 'verse-6',
              book: 'Psalm',
              chapter: 23,
              verse: 4,
              text: 'Yea, though I walk through the valley of the shadow of death, I will fear no evil: for thou art with me; thy rod and thy staff they comfort me.',
              translation: 'KJV'
            }
          ]
        },
        duration: 180,
        order: 4
      }
    ]
  },
  {
    id: 'service-2',
    name: 'Wednesday Evening Service',
    date: '2024-01-17',
    startTime: '7:00 PM',
    endTime: '8:30 PM',
    notes: 'Midweek prayer and worship',
    items: [
      {
        id: 'item-5',
        type: 'scripture',
        title: 'Romans 3:23',
        content: {
          verses: [
            {
              id: 'verse-7',
              book: 'Romans',
              chapter: 3,
              verse: 23,
              text: 'For all have sinned, and come short of the glory of God;',
              translation: 'KJV'
            }
          ]
        },
        duration: 90,
        order: 1
      },
      {
        id: 'item-6',
        type: 'announcement',
        title: 'Prayer Request',
        content: {
          title: 'Prayer Request',
          message: 'Please keep the Johnson family in your prayers during this difficult time.',
          urgency: 'high',
          details: 'They are going through a challenging health situation and would appreciate your support.'
        },
        duration: 45,
        order: 2
      }
    ]
  }
];

export default sampleServices;