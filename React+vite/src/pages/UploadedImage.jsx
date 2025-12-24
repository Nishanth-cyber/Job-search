export default function UploadedImage() {
  return (
    <main className="container" style={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
      <img src="/uploaded.png" alt="Uploaded" style={{ maxWidth: '100%', height: 'auto', borderRadius: 16, boxShadow: '0 16px 40px rgba(0,0,0,.12)' }} />
    </main>
  );
}
