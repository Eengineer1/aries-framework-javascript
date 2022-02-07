import type { AgentConfig } from '../../../../../agent/AgentConfig'
import type { Handler, HandlerInboundMessage } from '../../../../../agent/Handler'
import type { MediationRecipientService } from '../../../../routing'
import type { ProofResponseCoordinator } from '../../../ProofResponseCoordinator'
import type { V1LegacyProofService } from '../V1LegacyProofService'

import { V1RequestPresentationMessage } from '../messages'
import { V1ProofService } from '..'
import { DidCommMessageRepository } from '../../../../../storage/didcomm/DidCommMessageRepository'

export class V1RequestPresentationHandler implements Handler {
  private proofService: V1ProofService
  private agentConfig: AgentConfig
  private proofResponseCoordinator: ProofResponseCoordinator
  private mediationRecipientService: MediationRecipientService
  private didCommMessageRepository: DidCommMessageRepository
  public supportedMessages = [V1RequestPresentationMessage]

  public constructor(
    proofService: V1ProofService,
    agentConfig: AgentConfig,
    proofResponseCoordinator: ProofResponseCoordinator,
    mediationRecipientService: MediationRecipientService,
    didCommMessageRepository: DidCommMessageRepository
  ) {
    this.proofService = proofService
    this.agentConfig = agentConfig
    this.proofResponseCoordinator = proofResponseCoordinator
    this.mediationRecipientService = mediationRecipientService
    this.didCommMessageRepository = didCommMessageRepository
  }

  public async handle(messageContext: HandlerInboundMessage<V1RequestPresentationHandler>) {
    const proofRecord = await this.proofService.processRequest(messageContext)
    if (this.proofResponseCoordinator.shouldAutoRespondToRequest(proofRecord)) {
      //   return await this.createPresentation(proofRecord, messageContext)
    }
  }

  // private async createPresentation(
  //   record: ProofRecord,
  //   messageContext: HandlerInboundMessage<RequestPresentationHandler>
  // ) {
  //   const indyProofRequest = record.requestMessage?.indyProofRequest

  //   this.agentConfig.logger.info(
  //     `Automatically sending presentation with autoAccept on ${this.agentConfig.autoAcceptProofs}`
  //   )

  //   if (!indyProofRequest) {
  //     return
  //   }

  //   const retrievedCredentials = await this.proofService.getRequestedCredentialsForProofRequest(
  //     indyProofRequest,
  //     record.proposalMessage?.presentationProposal
  //   )

  //   const requestedCredentials = this.proofService.autoSelectCredentialsForProofRequest(retrievedCredentials)

  //   const { message, proofRecord } = await this.proofService.createPresentation(record, requestedCredentials)

  //   if (messageContext.connection) {
  //     return createOutboundMessage(messageContext.connection, message)
  //   } else if (proofRecord.requestMessage?.service) {
  //     // Create ~service decorator
  //     const routing = await this.mediationRecipientService.getRouting()
  //     const ourService = new ServiceDecorator({
  //       serviceEndpoint: routing.endpoints[0],
  //       recipientKeys: [routing.verkey],
  //       routingKeys: routing.routingKeys,
  //     })

  //     const recipientService = proofRecord.requestMessage.service

  //     // Set and save ~service decorator to record (to remember our verkey)
  //     message.service = ourService
  //     proofRecord.presentationMessage = message
  //     await this.proofService.update(proofRecord)

  //     return createOutboundServiceMessage({
  //       payload: message,
  //       service: recipientService.toDidCommService(),
  //       senderKey: ourService.recipientKeys[0],
  //     })
  //   }

  //   this.agentConfig.logger.error(`Could not automatically create presentation`)
  // }
}
