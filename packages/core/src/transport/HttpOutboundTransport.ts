import type { Agent } from '../agent/Agent'
import type { Logger } from '../logger'
import type { OutboundPackage } from '../types'
import type { OutboundTransport } from './OutboundTransport'
import type fetch from 'node-fetch'

import { AbortController } from 'abort-controller'

import { AgentConfig } from '../agent/AgentConfig'
import { AriesFrameworkError } from '../error/AriesFrameworkError'
import { isValidJweStucture, JsonEncoder } from '../utils'

export class HttpOutboundTransport implements OutboundTransport {
  private agent!: Agent
  private logger!: Logger
  private agentConfig!: AgentConfig
  private fetch!: typeof fetch

  public supportedSchemes = ['http', 'https']

  public async start(agent: Agent): Promise<void> {
    this.agent = agent
    this.agentConfig = agent.injectionContainer.resolve(AgentConfig)
    this.logger = this.agentConfig.logger
    this.fetch = this.agentConfig.agentDependencies.fetch

    this.logger.debug('Starting HTTP outbound transport')
  }

  public async stop(): Promise<void> {
    this.logger.debug('Stopping HTTP outbound transport')
    // Nothing required to stop HTTP
  }

  public async sendMessage(outboundPackage: OutboundPackage) {
    const { payload, endpoint } = outboundPackage

    if (!endpoint) {
      throw new AriesFrameworkError(`Missing endpoint. I don't know how and where to send the message.`)
    }

    this.logger.debug(`Sending outbound message to endpoint '${outboundPackage.endpoint}'`, {
      payload: outboundPackage.payload,
    })

    try {
      const abortController = new AbortController()
      const id = setTimeout(() => abortController.abort(), 15000)

      let response
      let responseMessage
      try {
        response = await this.fetch(endpoint, {
          method: 'POST',
          body: JSON.stringify(payload),
          headers: { 'Content-Type': this.agentConfig.didCommMimeType },
          signal: abortController.signal,
        })
        clearTimeout(id)
        responseMessage = await response.text()
      } catch (error) {
        // Request is aborted after 15 seconds, but that doesn't necessarily mean the request
        // went wrong. ACA-Py keeps the socket alive until it has a response message. So we assume
        // that if the error was aborted and we had return routing enabled, we should ignore the error.
        if (error.name == 'AbortError' && outboundPackage.responseRequested) {
          this.logger.debug(
            'Request was aborted due to timeout. Not throwing error due to return routing on sent message'
          )
        } else {
          throw error
        }
      }

      // TODO: do we just want to ignore messages that were returned if we didn't request it?
      // TODO: check response header type (and also update inbound transports to use the correct headers types)
      if (response && responseMessage) {
        this.logger.debug(`Response received`, { responseMessage, status: response.status })

        try {
          const encryptedMessage = JsonEncoder.fromString(responseMessage)
          if (!isValidJweStucture(encryptedMessage)) {
            this.logger.error(
              `Received a response from the other agent but the structure of the incoming message is not a DIDComm message: ${responseMessage}`
            )
            return
          }
          this.agent.receiveMessage(encryptedMessage)
        } catch (error) {
          this.logger.debug('Unable to parse response message')
        }
      } else {
        this.logger.debug(`No response received.`)
      }
    } catch (error) {
      this.logger.error(`Error sending message to ${endpoint}: ${error.message}`, {
        error,
        message: error.message,
        body: payload,
        didCommMimeType: this.agentConfig.didCommMimeType,
      })
      throw new AriesFrameworkError(`Error sending message to ${endpoint}: ${error.message}`, { cause: error })
    }
  }
}
