export default () => [
  {
    id: 'john-smith-id',
    name: 'John Smith',
    fatherId: 'fatherId1',
    'x-offset': new Date().getTime().toString(),
  },
  {
    id: 'samantha-jones-id',
    name: 'Samantha Jones',
    fatherId: 'fatherId2',
    'x-offset': (new Date().getTime() + 1).toString(),
  },
];
