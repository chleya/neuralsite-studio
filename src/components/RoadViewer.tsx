import { useState, useEffect, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Grid, Line, Text } from '@react-three/drei'
import * as THREE from 'three'

interface Coordinate {
  station: string
  x: number
  y: number
  z: number
  azimuth: number
}

interface RoadViewerProps {
  coordinates: Coordinate[]
  loading?: boolean
}

// 道路中心线组件
function CenterLine({ coordinates }: { coordinates: Coordinate[] }) {
  // 归一化坐标
  const points = coordinates.map(c => {
    // 使用相对坐标，避免精度问题
    const baseX = coordinates[0]?.x || 0
    const baseY = coordinates[0]?.y || 0
    return new THREE.Vector3(
      (c.x - baseX) / 100,  // X方向缩小100倍
      c.z / 10,              // Z(高程)方向缩小10倍
      (c.y - baseY) / 100   // Y方向缩小100倍
    )
  })

  if (points.length < 2) return null

  return (
    <group>
      {/* 道路中心线 */}
      <Line
        points={points}
        color="#00ff88"
        lineWidth={4}
      />
      
      {/* 起点标记 */}
      <mesh position={points[0]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial color="#ff6b6b" emissive="#ff0000" emissiveIntensity={0.5} />
      </mesh>
      <Text position={[points[0].x + 2, points[0].y + 2, points[0].z]} fontSize={2} color="white">
        起点
      </Text>
      
      {/* 终点标记 */}
      <mesh position={points[points.length - 1]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial color="#4ecdc4" emissive="#00ff88" emissiveIntensity={0.5} />
      </mesh>
      <Text position={[points[points.length - 1].x + 2, points[points.length - 1].y + 2, points[points.length - 1].z]} fontSize={2} color="white">
        终点
      </Text>
    </group>
  )
}

// 路基网格组件
function RoadMesh({ coordinates, width = 10 }: { coordinates: Coordinate[], width?: number }) {
  const baseX = coordinates[0]?.x || 0
  const baseY = coordinates[0]?.y || 0
  
  // 生成道路左右边界点
  const leftPoints: THREE.Vector3[] = []
  const rightPoints: THREE.Vector3[] = []
  
  coordinates.forEach(c => {
    const relX = (c.x - baseX) / 100
    const relY = (c.z / 10)
    const relZ = (c.y - baseY) / 100
    
    const rad = (c.azimuth || 45) * Math.PI / 180
    const halfW = width / 200  // 缩小宽度
    
    // 左右偏移
    const leftX = relX + halfW * Math.cos(rad + Math.PI / 2)
    const leftZ = relZ + halfW * Math.sin(rad + Math.PI / 2)
    
    const rightX = relX + halfW * Math.cos(rad - Math.PI / 2)
    const rightZ = relZ + halfW * Math.sin(rad - Math.PI / 2)
    
    leftPoints.push(new THREE.Vector3(leftX, relY, leftZ))
    rightPoints.push(new THREE.Vector3(rightX, relY, rightZ))
  })
  
  // 创建带状几何体
  const geometry = new THREE.BufferGeometry()
  const vertices: number[] = []
  
  for (let i = 0; i < leftPoints.length - 1; i++) {
    // 左上
    vertices.push(leftPoints[i].x, leftPoints[i].y, leftPoints[i].z)
    // 右上
    vertices.push(rightPoints[i].x, rightPoints[i].y, rightPoints[i].z)
    // 左下
    vertices.push(leftPoints[i + 1].x, leftPoints[i + 1].y, leftPoints[i + 1].z)
    
    // 右上
    vertices.push(rightPoints[i].x, rightPoints[i].y, rightPoints[i].z)
    // 右下
    vertices.push(rightPoints[i + 1].x, rightPoints[i + 1].y, rightPoints[i + 1].z)
    // 左下
    vertices.push(leftPoints[i + 1].x, leftPoints[i + 1].y, leftPoints[i + 1].z)
  }
  
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  geometry.computeVertexNormals()
  
  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color="#3d5a80" side={THREE.DoubleSide} opacity={0.8} transparent />
    </mesh>
  )
}

// 主场景
function Scene({ coordinates, loading }: { coordinates: Coordinate[], loading?: boolean }) {
  return (
    <>
      {/* 灯光 */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[50, 50, 25]} intensity={1} castShadow />
      <pointLight position={[0, 20, 0]} intensity={0.5} color="#4ecdc4" />
      
      {/* 地面网格 */}
      <Grid 
        args={[200, 200]} 
        cellSize={5} 
        cellThickness={0.5} 
        sectionSize={20}
        sectionThickness={1}
        fadeDistance={150}
        infiniteGrid
        cellColor="#444"
        sectionColor="#666"
      />
      
      {/* 坐标轴 */}
      <axesHelper args={[10]} />
      
      {/* 道路中心线 */}
      {coordinates.length > 0 && <CenterLine coordinates={coordinates} />}
      
      {/* 路基网格 */}
      {coordinates.length > 0 && <RoadMesh coordinates={coordinates} width={20} />}
      
      {/* 加载指示 */}
      {loading && (
        <mesh position={[0, 10, 0]}>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color="orange" />
      </mesh>
      )}
    </>
  )
}

// 导出主组件
export default function RoadViewer({ coordinates, loading = false }: RoadViewerProps) {
  return (
    <div style={{ width: '100%', height: '100%', background: '#0a0a15' }}>
      <Canvas
        camera={{ position: [50, 50, 50], fov: 60 }}
        shadows
      >
        <Scene coordinates={coordinates} loading={loading} />
        <OrbitControls 
          enableDamping 
          dampingFactor={0.05}
          minDistance={10}
          maxDistance={200}
        />
      </Canvas>
      
      {/* 图例 */}
      <div style={{
        position: 'absolute',
        bottom: 20,
        left: 20,
        background: 'rgba(0,0,0,0.7)',
        padding: '10px 15px',
        borderRadius: 8,
        fontSize: 12,
        color: '#aaa'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 5 }}>
          <span style={{ width: 20, height: 4, background: '#00ff88', marginRight: 8 }}></span>
          道路中心线
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 5 }}>
          <span style={{ width: 20, height: 4, background: '#3d5a80', marginRight: 8 }}></span>
          路基面
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff6b6b', marginRight: 8 }}></span>
          起点
        </div>
      </div>
      
      {/* 点数统计 */}
      <div style={{
        position: 'absolute',
        top: 20,
        right: 20,
        background: 'rgba(0,0,0,0.7)',
        padding: '10px 15px',
        borderRadius: 8,
        fontSize: 12,
        color: '#00ff88'
      }}>
        点数: {coordinates.length}
      </div>
    </div>
  )
}
