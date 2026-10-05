import Swal from "sweetalert2"

export const SwalDelete = async () => {
  const result = await Swal.fire({
    title: 'Apakah Kamu Yakin?',
    text: "Kamu tidak akan bisa mengembalikan data ini!",
    icon: 'warning',
    showCancelButton: true,
    customClass: {
      confirmButton: 'bg-primary text-background',
      cancelButton: 'bg-danger text-background',
    },
    confirmButtonText: 'Yes, delete it!',
  })

  return result.isConfirmed
}

export const SwalUpdateStatus = async status => {
  const result = await Swal.fire({
    title: `Apakah Kamu Yakin Ingin ${status} Data Ini?`,
    icon: 'warning',
    showCancelButton: true,
    customClass: {
      confirmButton: 'bg-primary text-background',
      cancelButton: 'bg-danger text-background',
    },
    confirmButtonText: `Yes, ${status} it!`,
  })
    
  return result.isConfirmed
}
