export default [
  {
    title: 'Home',
    icon: { icon: 'tabler-smart-home' },
    to: { name: 'root' },
  },

  // {
  //   title: 'Surat Tugas',
  //   icon: { icon: 'tabler-file' },
  //   to: { name: 'surat-tugas' },
  // },
  {
    title: 'Surat Keputusan',
    icon: { icon: 'tabler-file-text' },
    to: { name: 'surat-keputusan' },
  },
  {
    title: 'Pengajuan Surat',
    icon: { icon: 'tabler-file-plus' },
    to: { name: 'submission' },
  },
  {
    title: 'Setup',
    icon: { icon: 'tabler-settings' },
    to: { name: '' },
    children: [      
      {
        title: 'Tag Groups',
        to: 'setup-group',
      },
      {
        title: 'Unit',
        to: 'setup-unit',
      },
      {
        title: 'Pegawai',
        to: 'setup-user',
      },
    ],
  },
  {
    title: 'UU RI',
    icon: { icon: 'tabler-book' },
    to: { name: 'regulation' },
  },
]
