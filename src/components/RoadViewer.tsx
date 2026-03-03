import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid, Line } from '@react-three/drei'
import { useMemo } from 'react'

interface Coordinate {
  station: string
  x: number
  y: number
  z: number
  azimuth: number
}

interface RoadViewerProps {
  coordinates: Coordinate[]
}

function RoadViewer({ coordinates }: RoadViewerProps) {
  // 生成道路中心线
  const centerLine = useMemo(() => {
    if (coordinates.length === 0) return []
    return coordinates.map(c => [c.x, c.z, c.y])
  }, [coordinates])

  // 归一化坐标（便于查看）
  const normalizedPoints = useMemo(() => {
    if (coordinates.length === 0) return []
    const baseX = coordinates[0]?.x || 0
    const baseY = coordinates[0]?.y || 0
    return coordinates.map(c => [
      (c.x - baseX) / 100,
      c.z / 10,
      (c.y - baseY) / 100
    ])
  }, [coordinates])

  return (
    <Canvas camera={{ position: [50, 50, 50], fov: 60 }}>
      <color attach="background" args={['#1a1a2e']} />
      
      {/* 灯光 */}
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      
      {/* 网格 */}
      <Grid args={[200, 200]} cellSize={5} cellThickness={0.5} sectionSize={20} fadeDistance={100} />
      
      {/* 坐标轴 */}
      <axesHelper args={[10]} />
      
      {/* 道路中心线 */}
      {normalizedPoints.length > 1 && (
        <Line 
          points={normalizedPoints}
          color="#00ff88"
          lineWidth={3}
        />
      )}
      
      {/* 道路点 */}
      {normalizedPoints.map((point, i) => (
        <mesh key={i} position={point}>
          <sphereGeometry args={[0.5, 8, 8]} />
          <meshStandardMaterial color="#ff6b6b" />
        </mesh>
      ))}
      
      {/* 控制器 */}
      <OrbitControls />
    </Canvas>
  )
}

export default RoadViewer
