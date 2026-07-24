"use client";

import {useMutation, useQueryClient} from '@tanstack/react-query';
import React from 'react'
import {githubRepoKeys} from '@/features/github/lib/repos-query';
import {Button} from '@/components/ui/button'
import { string } from 'better-auth';
import { RepoSyncStatus } from '../types';
import { syncRepoCodebase } from '../action/repo-sync';
import { toast } from 'sonner';

type SyncRepoButtonProps = {
    repoFullName: string,
    branch: string,
    syncStatus: RepoSyncStatus |  null;
}

function isSyncing(status: RepoSyncStatus | null, mutationPending: boolean){
    if(mutationPending){
        return true
    }
    return status === "pending" || status === "syncing";
}

function getButtonLabel(status: RepoSyncStatus | null, mutationPending: boolean){
    if(isSyncing(status, mutationPending)){
        return "Syncing";
    }
    if(status ===  "synced"){
        return  "Re-sync";
    }
    return "Sync";
}

const SyncRepoButton = ({repoFullName, branch, syncStatus}:SyncRepoButtonProps) => {
    const queryClient = useQueryClient();

    const syncRepo = useMutation({
        mutationFn:()=>syncRepoCodebase(repoFullName, branch),
        onSuccess:()=>{
            queryClient.invalidateQueries({queryKey: githubRepoKeys.all});
            toast.success('Repo ${repoFullName} synced successfully');
        },
    })
 
    const syncing = isSyncing(syncStatus, syncRepo.isPending);


    return (
      <Button
      size="sm"
      variant="outline"
      disabled={syncing}
      onClick={() => syncRepo.mutate()}
    >
      {getButtonLabel(syncStatus, syncRepo.isPending)}
    </Button>
  )
}

export default SyncRepoButton
