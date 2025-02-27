import { mockFunction } from '../../../tests/helpers'
import { ConnectionInvitationMessage } from '../../modules/connections'
import { JsonTransformer } from '../../utils/JsonTransformer'
import { IndyStorageService } from '../IndyStorageService'
import { DidCommMessageRecord, DidCommMessageRepository, DidCommMessageRole } from '../didcomm'

jest.mock('../IndyStorageService')

const StorageMock = IndyStorageService as unknown as jest.Mock<IndyStorageService<DidCommMessageRecord>>

const invitationJson = {
  '@type': 'https://didcomm.org/connections/1.0/invitation',
  '@id': '04a2c382-999e-4de9-a1d2-9dec0b2fa5e4',
  recipientKeys: ['recipientKeyOne', 'recipientKeyTwo'],
  serviceEndpoint: 'https://example.com',
  label: 'test',
}

describe('Repository', () => {
  let repository: DidCommMessageRepository
  let storageMock: IndyStorageService<DidCommMessageRecord>

  beforeEach(async () => {
    storageMock = new StorageMock()
    repository = new DidCommMessageRepository(storageMock)
  })

  const getRecord = ({ id }: { id?: string } = {}) => {
    return new DidCommMessageRecord({
      id,
      message: invitationJson,
      role: DidCommMessageRole.Receiver,
      associatedRecordId: '16ca6665-29f6-4333-a80e-d34db6bfe0b0',
    })
  }

  describe('getAgentMessage()', () => {
    it('should get the record using the storage service', async () => {
      const record = getRecord({ id: 'test-id' })
      mockFunction(storageMock.findByQuery).mockReturnValue(Promise.resolve([record]))

      const invitation = await repository.getAgentMessage({
        messageClass: ConnectionInvitationMessage,
        associatedRecordId: '04a2c382-999e-4de9-a1d2-9dec0b2fa5e4',
      })

      expect(storageMock.findByQuery).toBeCalledWith(DidCommMessageRecord, {
        associatedRecordId: '04a2c382-999e-4de9-a1d2-9dec0b2fa5e4',
        messageType: 'https://didcomm.org/connections/1.0/invitation',
      })
      expect(invitation).toBeInstanceOf(ConnectionInvitationMessage)
    })
  })
  describe('findAgentMessage()', () => {
    it('should get the record using the storage service', async () => {
      const record = getRecord({ id: 'test-id' })
      mockFunction(storageMock.findByQuery).mockReturnValue(Promise.resolve([record]))

      const invitation = await repository.findAgentMessage({
        messageClass: ConnectionInvitationMessage,
        associatedRecordId: '04a2c382-999e-4de9-a1d2-9dec0b2fa5e4',
      })

      expect(storageMock.findByQuery).toBeCalledWith(DidCommMessageRecord, {
        associatedRecordId: '04a2c382-999e-4de9-a1d2-9dec0b2fa5e4',
        messageType: 'https://didcomm.org/connections/1.0/invitation',
      })
      expect(invitation).toBeInstanceOf(ConnectionInvitationMessage)
    })
    it("should return null because the record doesn't exist", async () => {
      mockFunction(storageMock.findByQuery).mockReturnValue(Promise.resolve([]))

      const invitation = await repository.findAgentMessage({
        messageClass: ConnectionInvitationMessage,
        associatedRecordId: '04a2c382-999e-4de9-a1d2-9dec0b2fa5e4',
      })

      expect(storageMock.findByQuery).toBeCalledWith(DidCommMessageRecord, {
        associatedRecordId: '04a2c382-999e-4de9-a1d2-9dec0b2fa5e4',
        messageType: 'https://didcomm.org/connections/1.0/invitation',
      })
      expect(invitation).toBeNull()
    })
  })

  describe('saveAgentMessage()', () => {
    it('should transform and save the agent message', async () => {
      await repository.saveAgentMessage({
        role: DidCommMessageRole.Receiver,
        agentMessage: JsonTransformer.fromJSON(invitationJson, ConnectionInvitationMessage),
        associatedRecordId: '04a2c382-999e-4de9-a1d2-9dec0b2fa5e4',
      })

      expect(storageMock.save).toBeCalledWith(
        expect.objectContaining({
          role: DidCommMessageRole.Receiver,
          message: invitationJson,
          associatedRecordId: '04a2c382-999e-4de9-a1d2-9dec0b2fa5e4',
        })
      )
    })
  })

  describe('saveOrUpdateAgentMessage()', () => {
    it('should transform and save the agent message', async () => {
      mockFunction(storageMock.findByQuery).mockReturnValue(Promise.resolve([]))
      await repository.saveOrUpdateAgentMessage({
        role: DidCommMessageRole.Receiver,
        agentMessage: JsonTransformer.fromJSON(invitationJson, ConnectionInvitationMessage),
        associatedRecordId: '04a2c382-999e-4de9-a1d2-9dec0b2fa5e4',
      })

      expect(storageMock.save).toBeCalledWith(
        expect.objectContaining({
          role: DidCommMessageRole.Receiver,
          message: invitationJson,
          associatedRecordId: '04a2c382-999e-4de9-a1d2-9dec0b2fa5e4',
        })
      )
    })
    it('should transform and update the agent message', async () => {
      const record = getRecord({ id: 'test-id' })
      mockFunction(storageMock.findByQuery).mockReturnValue(Promise.resolve([record]))
      await repository.saveOrUpdateAgentMessage({
        role: DidCommMessageRole.Receiver,
        agentMessage: JsonTransformer.fromJSON(invitationJson, ConnectionInvitationMessage),
        associatedRecordId: '04a2c382-999e-4de9-a1d2-9dec0b2fa5e4',
      })

      expect(storageMock.update).toBeCalledWith(record)
    })
  })
})
