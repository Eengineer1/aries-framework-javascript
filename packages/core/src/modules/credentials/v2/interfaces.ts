import type { LinkedAttachment } from '../../../utils/LinkedAttachment'
import type { AnyJson } from '../../generic'
import type { AutoAcceptCredential } from '../CredentialAutoAcceptType'
import type { CredentialPreviewAttribute } from '../CredentialPreviewAttributes'
import type { CredentialProtocolVersion } from '../CredentialProtocolVersion'
import type { CredentialRecordType } from './CredentialExchangeRecord'
import type { CredDef, CredOffer, CredReq, CredReqMetadata } from 'indy-sdk'

type IssuerId = string

interface IssuerNode {
  id: string
  [x: string]: AnyJson
}

export type Issuer = IssuerId | IssuerNode
type LDSignatureSuite = 'Ed25519Signature2018' | 'BbsBlsSignature2020'

export interface W3CCredentialFormat {
  credential: {
    '@context': string | Record<string, AnyJson>
    issuer: Issuer
    type: string | string[]
    issuanceDate: string
    proof?: Record<string, AnyJson> | Array<Record<string, AnyJson>>
    [x: string]: unknown
  }
  format: {
    linkedDataProof: {
      proofType: Array<string | LDSignatureSuite>
    }
  }
}

/// CREDENTIAL OFFER
export interface IndyOfferCredentialFormat {
  credentialDefinitionId: string
  attributes: CredentialPreviewAttribute[]
}

export interface OfferCredentialFormats {
  indy?: IndyOfferCredentialFormat
  w3c?: W3CCredentialFormat
}

// Used in OfferCredential
interface OfferCredentialOptions {
  connectionId: string
  protocolVersion: CredentialProtocolVersion
  credentialFormats: OfferCredentialFormats
  autoAcceptCredential?: AutoAcceptCredential
  comment?: string
}

interface AcceptOfferOptions {
  connectionId: string
  protocolVersion: CredentialProtocolVersion
  credentialRecordId: string
  credentialRecordType: CredentialRecordType
  comment?: string
  autoAcceptCredential?: AutoAcceptCredential
}

interface NegotiateOfferOptions {
  credentialRecordId: string
  credentialFormats: OfferCredentialFormats
  autoAcceptCredential?: AutoAcceptCredential
  comment?: string
}

/// CREDENTIAL PROPOSAL

// this is the base64 encoded data payload for [Indy] credential proposal
interface CredPropose {
  attributes?: CredentialPreviewAttribute[]
  schemaIssuerDid?: string
  schemaName?: string
  schemaVersion?: string
  schemaId?: string
  issuerDid?: string
  credentialDefinitionId?: string
  linkedAttachments?: LinkedAttachment[]
}

export interface V2CredProposalFormat {
  indy?: CredPropose
  w3c?: {
    // MJR-TODO
  }
}

interface ProposeCredentialOptions {
  connectionId: string
  protocolVersion: CredentialProtocolVersion
  credentialFormats: V2CredProposalFormat
  autoAcceptCredential?: AutoAcceptCredential
  comment?: string
}

export interface V2CredDefinitionFormat {
  indy?: {
    credentialDefinition: CredDef
  }
  w3c?: {
    // MJR-TODO
  }
}

export interface V2CredOfferFormat {
  indy?: {
    credentialOffer: CredOffer
  }
  w3c?: {
    // MJR-TODO
  }
}

interface IndyCredentialPreview {
  // Could be that credential definition id and attributes are already defined
  // But could also be that they are undefined. So we can't make them required
  credentialDefinitionId?: string
  attributes?: CredentialPreviewAttribute[]
}
export type FormatType = AcceptProposalOptions | ProposeCredentialOptions

interface AcceptProposalOptions {
  connectionId: string
  protocolVersion: CredentialProtocolVersion
  credentialRecordId: string
  comment?: string
  autoAcceptCredential?: AutoAcceptCredential
  credentialFormats: {
    indy?: IndyCredentialPreview
    w3c?: {
      // MJR-TODO
    }
  }
}

interface NegotiateProposalOptions {
  credentialRecordId: string
  credentialFormats: OfferCredentialFormats
  autoAcceptCredential?: AutoAcceptCredential
  comment?: string
}

/// CREDENTIAL REQUEST
// this is the base64 encoded data payload for [Indy] credential request
export interface V2CredRequestFormat {
  // Indy cannot start from credential request - MJR: but you can still have credential requests in Indy
  // in response to an offer
  indy?: {
    request: CredReq
    requestMetaData?: CredReqMetadata
  }
  w3c?: W3CCredentialFormat
}

interface RequestCredentialOptions {
  credentialRecordType: CredentialRecordType
  connectionId?: string
  holderDid: string
  // As indy cannot start from request and w3c is not supported in v1 we always use v2 here
  credentialFormats?: V2CredRequestFormat
  autoAcceptCredential?: AutoAcceptCredential
  comment?: string
  offer?: V2CredOfferFormat // will not be there if this is a W3C request rather than an indy response to offer
  credentialDefinition?: V2CredDefinitionFormat
}

interface AcceptRequestOptions {
  credentialRecordId: string
  comment?: string
  autoAcceptCredential?: AutoAcceptCredential
}

export {
  OfferCredentialOptions,
  ProposeCredentialOptions,
  AcceptProposalOptions,
  NegotiateProposalOptions,
  AcceptOfferOptions,
  NegotiateOfferOptions,
  RequestCredentialOptions,
  AcceptRequestOptions,
  CredPropose as IndyProposeCredentialFormat,
}
