import { formatAddress } from '../external-apis/InjectedWeb3API';
import { log } from '../log';
import {
    EncryptionEnvelop,
    Envelop,
    getEnvelopMetaData,
    isEncryptionEnvelop,
} from '../Messaging';
import { getConversationId } from '../Storage';
import { checkToken, Session } from './Session';

export function getMessages(
    sessions: Map<string, Session>,
    messages: Map<string, (EncryptionEnvelop | Envelop)[]>,
    accountAddress: string,
    contactAddress: string,
    token: string,
) {
    log(`[getMessages]`);
    const account = formatAddress(accountAddress);
    const contact = formatAddress(contactAddress);
    const conversationId = getConversationId(contact, account);
    log(`- Conversations id: ${conversationId}`);

    if (checkToken(sessions, account, token)) {
        const receivedMessages: (EncryptionEnvelop | Envelop)[] = (
            messages.has(conversationId) ? messages.get(conversationId) : []
        ) as (EncryptionEnvelop | Envelop)[];

        const forAccount = receivedMessages.filter(
            (envelop) =>
                formatAddress(getEnvelopMetaData(envelop).to) === account,
        );

        log(`- ${receivedMessages?.length} messages`);

        // remove deliverd messages
        messages.set(
            conversationId,
            receivedMessages.filter(
                (envelop) =>
                    formatAddress(getEnvelopMetaData(envelop).to) !== account,
            ),
        );
        return {
            messages: forAccount,
        };
    } else {
        throw Error('Token check failed');
    }
}

export function getPendingConversations(
    sessions: Map<string, Session>,
    pendingConversations: Map<string, Set<string>>,
    accountAddress: string,
    token: string,
) {
    log(`[getPendingConversations]`);
    const account = formatAddress(accountAddress);

    log(`- Account: ${accountAddress}`);

    if (checkToken(sessions, account, token)) {
        const conversations = pendingConversations.get(account);
        pendingConversations.set(account, new Set<string>());
        if (conversations) {
            return { pendingConversations: Array.from(conversations) };
        } else {
            return { pendingConversations: [] };
        }
    } else {
        throw Error('Token check failed');
    }
}

export function incomingMessage(
    data: { envelop: Envelop | EncryptionEnvelop; token: string },
    sessions: Map<string, Session>,
    messages: Map<string, (Envelop | EncryptionEnvelop)[]>,
    pendingConversations: Map<string, Set<string>>,
    send: (socketId: string, envelop: Envelop | EncryptionEnvelop) => void,
): string {
    const account = formatAddress(
        isEncryptionEnvelop(data.envelop)
            ? formatAddress(data.envelop.from)
            : (data.envelop as Envelop).message.from,
    );

    const contact = formatAddress(
        isEncryptionEnvelop(data.envelop)
            ? formatAddress(data.envelop.to)
            : (data.envelop as Envelop).message.to,
    );
    const conversationId = getConversationId(account, contact);
    log(`- Conversations id: ${conversationId}`);

    if (checkToken(sessions, account, data.token)) {
        const conversation = (
            messages.has(conversationId) ? messages.get(conversationId) : []
        ) as (Envelop | EncryptionEnvelop)[];

        conversation.push(data.envelop);

        if (!messages.has(conversationId)) {
            messages.set(conversationId, conversation);
        }

        const contactSession = sessions.get(contact);
        if (contactSession?.socketId) {
            log(`- Forwarding message to ${contact}`);
            send(contactSession.socketId, data.envelop);
        }

        const selfSession = sessions.get(account);
        if (selfSession?.socketId) {
            log(`- Acknowledge incoming message for ${account}`);
            send(selfSession.socketId, data.envelop);
        }

        if (pendingConversations.has(contact)) {
            const conversations = pendingConversations.get(
                contact,
            ) as Set<string>;
            pendingConversations.set(contact, conversations.add(account));
        } else {
            pendingConversations.set(contact, new Set<string>([account]));
        }

        return 'success';
    } else {
        throw Error('Token check failed');
    }
}
