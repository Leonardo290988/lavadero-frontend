export default function Header() {
  return (
    <div className="h-16 bg-white shadow flex items-center justify-between px-6">
      {/* Izquierda */}
      <h1 className="text-lg font-semibold text-gray-700">
        Sistema de gestión
      </h1>

      {/* Derecha */}
      <div className="text-sm text-gray-500">
        Lavaderos Moreno
      </div>
    </div>
  );
}
