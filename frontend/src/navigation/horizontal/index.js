import { getVerifierStages } from '@/utils/utils'

const currentUser = () => {
  try {
    return JSON.parse(localStorage.getItem('App-User'))
  } catch (error) {
    return null
  }
}

export const getNavItems = () => {
  const admin = !!currentUser()?.is_admin
  const verifier = getVerifierStages().length > 0

  return [
    { title: 'Home', icon: { icon: 'tabler-smart-home' }, to: { name: 'root' } },
    { title: 'Surat Keputusan', icon: { icon: 'tabler-file-text' }, to: { name: 'surat-keputusan' } },
    { title: 'Pengajuan Surat', icon: { icon: 'tabler-file-plus' }, to: { name: 'submission' } },

    ...(verifier ? [{
      title: 'Daftar Persetujuan',
      icon: { icon: 'tabler-list-check' },
      to: { name: 'verification' },
    }] : []),

    {
      title: 'Setup',
      icon: { icon: 'tabler-settings' },
      to: { name: '' },
      children: [
        { title: 'Tag Groups', to: 'setup-group' },
        { title: 'Unit', to: 'setup-unit' },
        { title: 'Pegawai', to: 'setup-user' },
        ...(admin ? [{ title: 'Alur Verifikasi', to: 'setup-verification' }] : []),
      ],
    },
    { title: 'UU RI', icon: { icon: 'tabler-book' }, to: { name: 'regulation' } },
  ]
}

export default getNavItems()