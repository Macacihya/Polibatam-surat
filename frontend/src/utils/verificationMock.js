// Data & handler palsu supaya halaman verifikator bisa dicoba tanpa backend.
// Aktif hanya jika VITE_VERIFICATION_MOCK=true. Hapus file ini kalau backend sudah siap.
import moment from 'moment'

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

const ok = (data, extra = {}) => ({ data: { data, message: 'Berhasil', ...extra } })

const fail = (status, message) => Promise.reject({ response: { status, data: { message } } })

const USERS = [
  { nip: 'dosen', nama: 'DR. BUDI SANTOSO, M.KOM', email: 'dosen@polibatam.ac.id', unit: 'Jurusan Teknik Informatika', staff: 'Tenaga Pendidik' },
  { nip: 'staff', nama: 'SITI RAHMAWATI, S.TR.KOM', email: 'staff@polibatam.ac.id', unit: 'Bagian Umum & Keuangan', staff: 'Tenaga Kependidikan' },
  { nip: '198001012005', nama: 'AHMAD FAUZI, M.T.', email: 'ahmad@polibatam.ac.id', unit: 'Jurusan Teknik Elektro', staff: 'Tenaga Pendidik' },
  { nip: '198502022010', nama: 'RINA MARLINA, S.E.', email: 'rina@polibatam.ac.id', unit: 'Bagian Kepegawaian', staff: 'Tenaga Kependidikan' },
  { nip: '197903032003', nama: 'HENDRA WIJAYA, M.SI.', email: 'hendra@polibatam.ac.id', unit: 'Wakil Direktur I', staff: 'Tenaga Pendidik' },
  { nip: '199004042015', nama: 'NADIA PUTRI, S.KOM.', email: 'nadia@polibatam.ac.id', unit: 'Pusat Informasi & Komputer', staff: 'Tenaga Kependidikan' },
]

const stages = [
  { stage: 1, name: 'Verifikasi Unit', verifiers: [USERS[2]] },
  { stage: 2, name: 'Verifikasi Bagian Umum', verifiers: [USERS[1], USERS[3]] },
  { stage: 3, name: 'Verifikasi Pimpinan', verifiers: [USERS[4]] },
]

let approvals = [
  { id: 101, title: 'SK Panitia Dies Natalis Polibatam ke-24', type: 'SK', current_stage: 1, hours: 3 },
  { id: 102, title: 'SK Tim Penyusun Kurikulum OBE Prodi TI', type: 'SK', current_stage: 1, hours: 26 },
  { id: 103, title: 'SK Pembimbing Kerja Praktik Semester Ganjil', type: 'SK', current_stage: 2, hours: 8 },
  { id: 104, title: 'SK Panitia Seminar Nasional Teknologi', type: 'SK', current_stage: 2, hours: 50 },
  { id: 105, title: 'SK Tim Akreditasi Program Studi', type: 'SK', current_stage: 3, hours: 5 },
].map(item => ({
  ...item,
  status: 'POSTED',
  creator: USERS[0],
  created_at: moment().subtract(item.hours + 12, 'hours').toISOString(),
  stage_entered_at: moment().subtract(item.hours, 'hours').toISOString(),
}))

const finished = {} // id -> { current_stage, rejected_at_stage?, remarks? }

const paginate = (list, params) => {
  const page = Number(params.page) || 1
  const page_size = Number(params.page_size) || 10
  const start = (page - 1) * page_size

  return {
    rows: list.slice(start, start + page_size),
    pagination: {
      page,
      page_size,
      total_items: list.length,
      total_pages: Math.max(1, Math.ceil(list.length / page_size)),
    },
  }
}

const buildTracking = id => {
  const live = approvals.find(item => item.id === id)
  const done = finished[id]
  const current = live?.current_stage ?? done?.current_stage ?? 2
  const rejected = done?.rejected_at_stage

  return {
    current_stage: current,
    steps: stages.map(s => {
      let state = 'PENDING'
      if (rejected === s.stage) state = 'REJECTED'
      else if (s.stage < current || (!live && !rejected && s.stage <= current)) state = 'DONE'
      else if (s.stage === current && !rejected) state = 'CURRENT'

      const acted = state === 'DONE' || state === 'REJECTED'

      return {
        stage: s.stage,
        name: s.name,
        state,
        verifiers: s.verifiers,
        acted_by: acted ? s.verifiers[0] : null,
        acted_at: acted ? moment().subtract(10 - s.stage * 3, 'hours').toISOString() : null,
        remarks: state === 'REJECTED' ? done.remarks : null,
      }
    }),
  }
}

export const mockApi = async ({ url, method = 'GET', params = {}, data = {} }) => {
  await delay(300)
  let m

  if (method === 'GET' && url === '/verification/stages') return ok(stages)

  if ((m = url.match(/^\/verification\/stages\/(\d)\/verifiers(?:\/(.+))?$/))) {
    const stage = stages.find(s => s.stage === Number(m[1]))
    if (!stage) return fail(404, 'Tahap tidak ditemukan')

    if (method === 'POST') {
      const user = USERS.find(u => u.nip === data.nip)
      if (!user) return fail(404, 'User tidak ditemukan')
      if (stage.verifiers.some(v => v.nip === user.nip)) return fail(409, 'User sudah menjadi verifikator di tahap ini')
      stage.verifiers.push(user)

      return ok(stage, { message: 'Verifikator ditambahkan' })
    }

    if (method === 'DELETE') {
      stage.verifiers = stage.verifiers.filter(v => v.nip !== m[2])

      return ok(stage, { message: 'Verifikator dihapus' })
    }
  }

  if (method === 'GET' && url === '/user') {
    const q = (params.search || '').toLowerCase()
    const list = USERS.filter(u => !q || u.nama.toLowerCase().includes(q) || u.nip.includes(q))
    const { rows, pagination } = paginate(list, params)

    return ok(rows, { pagination })
  }

  if (method === 'GET' && url === '/verification/approvals') {
    const mine = approvals.filter(a => a.current_stage === Number(params.stage))
    const q = (params.search || '').toLowerCase()
    const list = mine.filter(a => !q || a.title.toLowerCase().includes(q))
    const { rows, pagination } = paginate(list, params)
    const per_stage = { 1: 0, 2: 0, 3: 0 }
    approvals.forEach(a => { per_stage[a.current_stage]++ })

    return ok(rows, { pagination, meta: { per_stage } })
  }

  if ((m = url.match(/^\/verification\/approvals\/(\d+)\/(approve|reject)$/)) && method === 'PUT') {
    const id = Number(m[1])
    const item = approvals.find(a => a.id === id)
    if (!item) return fail(404, 'Surat tidak ditemukan')

    if (m[2] === 'reject') {
      finished[id] = { current_stage: item.current_stage, rejected_at_stage: item.current_stage, remarks: data.remarks }
      approvals = approvals.filter(a => a.id !== id)

      return ok(null, { message: 'Surat ditolak' })
    }

    if (item.current_stage >= 3) {
      finished[id] = { current_stage: 3 }
      approvals = approvals.filter(a => a.id !== id)
    } else {
      item.current_stage += 1
      item.stage_entered_at = moment().toISOString()
    }

    return ok(null, { message: 'Surat disetujui' })
  }

  if ((m = url.match(/^\/submission\/(\d+)\/verification$/)) && method === 'GET')
    return ok(buildTracking(Number(m[1])))

  return fail(404, `Mock belum mendukung ${method} ${url}`)
}
