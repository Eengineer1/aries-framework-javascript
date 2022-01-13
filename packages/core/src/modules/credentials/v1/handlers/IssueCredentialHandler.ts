import type { V1LegacyCredentialService } from '../..'
import type { AgentConfig } from '../../../../agent/AgentConfig'
import type { Handler, HandlerInboundMessage } from '../../../../agent/Handler'
import type { CredentialResponseCoordinator } from '../../CredentialResponseCoordinator'
import type { CredentialRecord } from '../../repository/CredentialRecord'

import { createOutboundMessage, createOutboundServiceMessage } from '../../../../agent/helpers'
import { IssueCredentialMessage } from '../messages'

export class IssueCredentialHandler implements Handler {
  private credentialService: V1LegacyCredentialService
  private agentConfig: AgentConfig
  private credentialResponseCoordinator: CredentialResponseCoordinator
  public supportedMessages = [IssueCredentialMessage]

  public constructor(
    credentialService: V1LegacyCredentialService,
    agentConfig: AgentConfig,
    credentialResponseCoordinator: CredentialResponseCoordinator
  ) {
    this.credentialService = credentialService
    this.agentConfig = agentConfig
    this.credentialResponseCoordinator = credentialResponseCoordinator
  }

  public async handle(messageContext: HandlerInboundMessage<IssueCredentialHandler>) {
    const credentialRecord = await this.credentialService.processCredential(messageContext)
    if (this.credentialResponseCoordinator.shouldAutoRespondToIssue(credentialRecord)) {
      return await this.createAck(credentialRecord, messageContext)
    }
  }

  private async createAck(record: CredentialRecord, messageContext: HandlerInboundMessage<IssueCredentialHandler>) {
    this.agentConfig.logger.info(
      `Automatically sending acknowledgement with autoAccept on ${this.agentConfig.autoAcceptCredentials}`
    )
    const { message, credentialRecord } = await this.credentialService.createAck(record)

    if (messageContext.connection) {
      return createOutboundMessage(messageContext.connection, message)
    } else if (credentialRecord.credentialMessage?.service && credentialRecord.requestMessage?.service) {
      const recipientService = credentialRecord.credentialMessage.service
      const ourService = credentialRecord.requestMessage.service

      return createOutboundServiceMessage({
        payload: message,
        service: recipientService.toDidCommService(),
        senderKey: ourService.recipientKeys[0],
      })
    }

    this.agentConfig.logger.error(`Could not automatically create credential ack`)
  }
}
