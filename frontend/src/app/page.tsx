import AudioRecorder from '@/components/AudioRecorder';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Consultation Note</h1>
      <AudioRecorder />
    </div>
  );
}
