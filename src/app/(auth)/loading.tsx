export default function AuthLoading() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div>
      <p className="ml-4 text-lg text-gray-700">Carregando conteúdo...</p>
    </div>
  );
}