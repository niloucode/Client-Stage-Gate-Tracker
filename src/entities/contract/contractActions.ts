'use server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// UPLOAD — stores file in Supabase, saves path in Prisma
export async function uploadContract(contractId: string, projectId: string, file: File) {
  const supabase = await createClient()

  const filePath = `${projectId}/${contractId}.pdf`

  const { error: uploadError } = await supabase.storage
    .from('contracts')
    .upload(filePath, file, {
      contentType: 'application/pdf', //restrict to pdfs onli
      upsert: true
    })

  if (uploadError) throw new Error(uploadError.message)

  // save the path reference in Prisma
  await prisma.contracts.update({
    where: { contract_id: contractId },
    data: {
      file_path: filePath,
      is_deleted: false,
      deleted_at: null // clear soft delete if re-uploading
    }
  })

  return filePath
}

// GET SIGNED URL — for viewing/downloading (expires in 1 hour)
export async function getContractUrl(filePath: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.storage.from('contracts').createSignedUrl(filePath, 3600) 
  // expires in 3600 seconds (1 hour)

  if (error) throw new Error(error.message)
  return data.signedUrl
}

// SOFT DELETE — marks as deleted in Prisma, removes from Storage
export async function deleteContract(contractId: string, filePath: string) {
  const supabase = await createClient()

  // soft delete in Prisma first
  await prisma.contracts.update({
    where: { contract_id: contractId },
    data: { 
        deleted_at: new Date(),
        is_deleted: true
     }
  })

  // remove actual file from storage
  const { error } = await supabase.storage
    .from('contracts')
    .remove([filePath])

  if (error) throw new Error(error.message)
}

// FETCH CONTRACT — checks soft delete
export async function getContract(contractId: string) {
  return prisma.contracts.findFirst({
    where: {
      contract_id: contractId,
      is_deleted: false // exclude soft-deleted
    }
  })
}