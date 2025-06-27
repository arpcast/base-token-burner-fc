export async function GET() {
  return Response.json({
    accountAssociation: {
      header: process.env.FARCASTER_HEADER!,
      payload: process.env.FARCASTER_PAYLOAD!,
      signature: process.env.FARCASTER_SIGNATURE!
    },
    frame: {
      version: '1',
      name: 'BurnFarcaster',
      iconUrl: `${process.env.NEXT_PUBLIC_URL}/icon.png`,
      homeUrl: process.env.NEXT_PUBLIC_URL
    }
  });
}
