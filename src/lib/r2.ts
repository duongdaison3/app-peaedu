import { S3Client } from '@aws-sdk/client-s3'

export interface R2Config {
  accountId: string
  accessKeyId: string
  secretAccessKey: string
  bucketName: string
  publicUrlBase: string
}

export function getR2Config(): R2Config {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim()
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim()
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim()
  const bucketName = process.env.R2_BUCKET_NAME?.trim()
  const publicUrlBase = process.env.R2_PUBLIC_URL_BASE?.trim()

  if (!accountId) throw new Error('Missing CLOUDFLARE_ACCOUNT_ID.')
  if (!accessKeyId) throw new Error('Missing R2_ACCESS_KEY_ID.')
  if (!secretAccessKey) throw new Error('Missing R2_SECRET_ACCESS_KEY.')
  if (!bucketName) throw new Error('Missing R2_BUCKET_NAME.')
  if (!publicUrlBase) throw new Error('Missing R2_PUBLIC_URL_BASE.')

  return { accountId, accessKeyId, secretAccessKey, bucketName, publicUrlBase }
}

export function createR2Client(config?: R2Config) {
  const resolved = config ?? getR2Config()

  return new S3Client({
    region: 'auto',
    endpoint: `https://${resolved.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: resolved.accessKeyId,
      secretAccessKey: resolved.secretAccessKey,
    },
  })
}

export function buildR2PublicUrl(config: R2Config, key: string) {
  return `${config.publicUrlBase.replace(/\/$/, '')}/${key}`
}