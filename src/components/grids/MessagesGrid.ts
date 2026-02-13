import { html, nothing } from "lit-html"
import { Badge } from "@components/Badge.ts"
import { GridBase } from "@base/grid/GridBase.ts"
import { messagesStore } from "@store/gridData.store.ts"
import { columnBodyRenderer } from "@vaadin/grid/lit.js"
import { MessageDetails } from "@components/panels/MessageDetails.ts"
import { markAsRead, getLastConversation } from "@controllers/messages.ts"
import type { Message } from "../../types.ts"
import type { GridColumnBodyLitRenderer } from "@vaadin/grid/lit.js"
import type { RealtimePostgresInsertPayload, RealtimePostgresUpdatePayload } from "@supabase/supabase-js"
import "@styles/messages-grid.css"

export class MessagesGrid extends GridBase<Message> {

	static #instance: MessagesGrid

	constructor() {
		super("#messagesView")
		this.initializeGridBase()
		this.connectRealtimeChannel()
		if (!!MessagesGrid.#instance) {
			return MessagesGrid.#instance
		}
		MessagesGrid.#instance = this
	}

	static getInstance() {
		if (!MessagesGrid.#instance) {
			new MessagesGrid()
		}
		return MessagesGrid.#instance
	}

	protected getRecordsStore() {
		return messagesStore
	}

	protected getRealtimeChannelName() {
		return "RealtimeChannelMessages"
	}

	protected getDbTableName() {
		return "messages"
	}

	protected getDbQuery() {
		return `
			*,
			sender:employees!messages_sender_reference_fkey (first_name, last_name, profile_avatar),
			receiver:employees!messages_receiver_reference_fkey (first_name, last_name, profile_avatar)
		`
	}

	protected getDbOrFilter() {
		const loggedInUserReference = this.loggedInUserData?.reference
		return {
			filters:
				`receiver_reference.eq.${loggedInUserReference},` +
				`sender_reference.eq.${loggedInUserReference}`
		}
	}

	public getGridUrlRoute() {
		return "/support/my-messages"
	}

	protected beforeRecordInserted(payload: RealtimePostgresInsertPayload<Message>) {
		const loggedInUserReference = this.loggedInUserData?.reference
		const receiverReference = payload.new.receiver_reference
		if (receiverReference !== loggedInUserReference) {
			console.log("MSG RECEIVER IS NOT THE CURRENT LOGGED USER")
			return false
		}
		if (receiverReference === loggedInUserReference && payload.new.conversations === null ) {
			console.log("MSG RECEIVER IS THE CURRENT LOGGED USER AND NEW.CONVERSATIONS IS NULL")
			return false
		}
	}

	protected beforeRecordUpdated(payload: RealtimePostgresUpdatePayload<Message>) {
		const loggedInUserReference = this.loggedInUserData?.reference
		const senderReference = payload.new.sender_reference
		const receiverReference = payload.new.receiver_reference
		const isSender = senderReference === loggedInUserReference
		const isReceiver = receiverReference === loggedInUserReference
		const areConversationLengthsEqual = payload.new.conversations?.length === payload.old.conversations?.length
		// Check if user is part of the conversation
		if (receiverReference !== loggedInUserReference && senderReference !== loggedInUserReference) {
			console.log("MSG RECEIVER AND MSG SENDER ARE NOT THE CURRENT LOGGED USER")
			return false
		}
		// Avoid render in the user conversation that don't have unread message
		if (areConversationLengthsEqual && !isSender && payload.old.sender_unread) {
			console.log("CURRENT LOGGED USER IS NOT MSG SENDER AND OLD.SENDER_UNREAD IS TRUE")
			return false
		}
		if (areConversationLengthsEqual && !isReceiver && payload.old.receiver_unread) {
			console.log("CURRENT LOGGED USER IS NOT MSG RECIEVER AND OLD.RECIEVER_UNREAD IS TRUE")
			return false
		}
		// re-initialize the grid in the reciever user for the first message
		if (receiverReference === loggedInUserReference && payload.old.conversations === null) {
			this.getGridDataAndRender()
			console.log("MSG RECEIVER IS CURRENT LOGGED USER AND OLD.CONVERSATIONS IS NULL")
			return true
		}
	}

	protected afterRecordUpdated(payload: RealtimePostgresUpdatePayload<Message>) {
		const urlReference = this.getUrlReference()
		const messageReference =  payload.new.reference.toString()
		if (urlReference === messageReference) {
			this.setUnreadMessage(payload)
			MessageDetails.getInstance().updateDetails(payload.new)
		}
	}

	protected async setUnreadMessage(payload: RealtimePostgresUpdatePayload<Message>) {
		const loggedInUserReference = this.loggedInUserData?.reference
		if (loggedInUserReference) {
			await markAsRead(this.supabase, payload.new, loggedInUserReference)
		}
	}

	protected unreadMessageBadge() {
		return Badge({
			theme: "small error dot primary",
			"aria-label": "unread"
		})
	}

	protected messagesRenderer: GridColumnBodyLitRenderer<Message> = (messages) => {
		const loggedInUserReference = this.loggedInUserData?.reference
		const isSender = messages.sender_reference === loggedInUserReference
		const contactInfo = isSender ? messages.receiver : messages.sender
		const hasUnreadMessages = isSender ? messages.sender_unread : messages.receiver_unread
		const fullName = `${contactInfo?.first_name} ${contactInfo?.last_name}`
		const abbr = `${contactInfo?.first_name[0]}${contactInfo?.last_name[0]}`
		const lastConversation = getLastConversation(messages)
		return html`
			<div class="Object p-m rounded-m msg-item">
				<vaadin-avatar 
					class="prefix" 
					theme="small"
					name=${fullName} 
					abbr=${abbr}>
				</vaadin-avatar>
				<a
					class="title text-m font-bold text-body leading-xs mb-xs"
					@click=${this.handleAnchorNavigation} 
					href="/support/my-messages/${messages.reference}">
					${fullName}
				</a>
				<div class="title-suffix text-s text-secondary leading-xs flex gap-s items-center">
					${lastConversation?.time || nothing}
					${hasUnreadMessages ? this.unreadMessageBadge() : nothing}
				</div>
				<div class="${hasUnreadMessages && `font-bold`} text-s text-secondary last-message leading-s">
					${lastConversation?.text || "(No messages yet)"}
				</div>
			</div>
		`
	}

	protected template() {
		return html`
			<vaadin-grid
				@cell-activate=${this.handleCellActivate}
				.items=${messagesStore.get()}
				.cellPartNameGenerator=${this.generatePart}
				theme="no-border"
				class="h-full transparent-body no-header">
				<vaadin-grid-column
					${columnBodyRenderer(this.messagesRenderer)}
				></vaadin-grid-column>
			</vaadin-grid>
		`
	}
	
}
