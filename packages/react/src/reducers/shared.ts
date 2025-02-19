import * as Lib from 'dm3-lib';
import { Cache } from './Cache';
import { SelectedRightView, UiState } from './UiState';

export type ActionMap<M extends { [index: string]: any }> = {
    [Key in keyof M]: M[Key] extends undefined
        ? {
              type: Key;
          }
        : {
              type: Key;
              payload: M[Key];
          };
};

export type Accounts = {
    contacts: Lib.Account[] | undefined;
    selectedContact: Lib.Account | undefined;
    accountInfoView: AccountInfo;
};

export type GlobalState = {
    connection: Lib.Connection;
    accounts: Accounts;
    cache: Cache;
    userDb: Lib.UserDB | undefined;
    uiState: UiState;
};

export enum AccountInfo {
    None,
    Contact,
    Account,
}

export const initialState: GlobalState = {
    connection: {
        connectionState: Lib.ConnectionState.CollectingSignInData,
        storageLocation: Lib.StorageLocation.dm3Storage,
        defaultServiceUrl: process.env.REACT_APP_BACKEND as string,
    },
    accounts: {
        contacts: undefined,
        selectedContact: undefined,
        accountInfoView: AccountInfo.None,
    },
    cache: {
        ensNames: new Map<string, string>(),
        abis: new Map<string, string>(),
        avatarUrls: new Map<string, string>(),
    },
    userDb: undefined,
    uiState: {
        showAddContact: false,
        selectedRightView: SelectedRightView.Chat,
        maxLeftView: true,
        show: false,
        lastMessagePull: 0,
        proflieExists: false,
        browserStorageBackup: false,
    },
};
