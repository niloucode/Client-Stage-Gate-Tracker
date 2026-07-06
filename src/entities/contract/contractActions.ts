'use server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// UPLOAD — stores file in Supabase, saves path in Prisma
export async function uploadContract(clientId: string, projectId: string, file: File, contractName: string) {
  const supabase = await createClient()

  //upsert if contract exists
  
  const updated_contract = await prisma.contracts.upsert({
    where: {
      project_id: projectId
    },
    update: {
      is_deleted: false, //reset soft-delete
      deleted_at: null
    },
    create: {
      client_id: clientId,
      project_id: projectId
    }
  })

  const fileName = contractName.trim() == '' ? updated_contract.contract_id : contractName
  const filePath = `${projectId}/${fileName}.pdf`

  const { error: uploadError } = await supabase.storage
    .from('contracts')
    .upload(filePath, file, {
      contentType: 'application/pdf', //restrict to pdfs onli
      upsert: true
    })

  if (uploadError) {
    //delete the recently made prisma record if storage fails on a new contract
    if (!updated_contract.file_path) {
      await prisma.contracts.delete({
        where: { contract_id: updated_contract.contract_id }
      })
    }
    throw new Error(uploadError.message)
  }

  // save the path reference in Prisma
  const final_contract = await prisma.contracts.update({
    where: { contract_id: updated_contract.contract_id },
    data: {
      file_path: filePath,
      is_deleted: false,
      deleted_at: null // clear soft delete if re-uploading
    }
  })

  return { contract: final_contract}
}

// GET SIGNED URL — for viewing/downloading (expires in 1 hour)
export async function getContractUrl(filePath: string) {
  console.log('🔍 Requesting signed URL for path:', filePath);
  const supabase = await createClient();
  // const { data, error } = await supabase.storage.from('contracts').createSignedUrl(filePath, 3600);
  const { data } = await supabase.storage.from('contracts').getPublicUrl(filePath)

  return data.publicUrl;
}

// SOFT DELETE — marks as deleted in Prisma, removes from Storage
export async function deleteContract(projectId: string, filePath: string) {
  const supabase = await createClient()

  // soft delete in Prisma first
  await prisma.contracts.update({
    where: { project_id: projectId },
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
export async function getContractByProjectId(projectId: string) {
  return prisma.contracts.findFirst({
    where: {
      project_id: projectId,
      is_deleted: false // exclude soft-deleted
    }
  })
}

export async function changeContractName(contractId: string, contractName: string){
  return prisma.contracts.update({
    where: { contract_id: contractId},
    data:
    {
      contract_name: contractName
    }
  })
}