import { useState, useEffect } from 'react'
import axios from 'axios'
import RoadViewer from './components/RoadViewer'
import ParameterPanel from './components/ParameterPanel'
import './index.css'

interface RouteParams {
  route_id: string
  design_speed: number
  horizontal_alignment: any[]
  vertical_alignment: any[]
}

interface Coordinate {
  station: string
  x: number
  y: number
  z: number
  azimuth: number
}

function App() {
  // 状态
  const [params, setParams] = useState<RouteParams>({
    route_id: 'demo',
    design_speed: 80,
    horizontal_alignment: [
      { element_type: '直线', start_station: 'K0+000', end_station: 'K0+500', azimuth: 45, x0: 500000, y0: 3000000 },
      { element_type: '缓和曲线', start_station: 'K0+500', end_station: 'K0+600', azimuth: 45, x0: 500353.553, y0: 3000353.553, A: 300, R: 800, direction: '右' },
      { element_type: '圆曲线', start_station: 'K0+600', end_station: 'K1+200', azimuth: 45, x0: 500424.264, y0: 3000424.264, R: 800, cx: 500424.264, cy: 3000224.264, direction: '右' }
    ],
    vertical_alignment: [
      { station: 'K0+000', elevation: 100, grade_out: 20 },
      { station: 'K0+500', elevation: 110, grade_in: 20, grade_out: -15, length: 200 },
      { station: 'K1+200', elevation: 99.5, grade_in: -15 }
    ]
  })
  
  const [coordinates, setCoordinates] = useState<Coordinate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // 计算参数
  const [startStation, setStartStation] = useState(0)
  const [endStation, setEndStation] = useState(1000)
  const [interval, setInterval] = useState(50)

  // 调用API计算坐标
  const calculateFromAPI = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // 尝试调用后端API
      const response = await axios.post('http://localhost:8000/api/v1/calculate/range', {
        route_id: params.route_id,
        start: startStation,
        end: endStation,
        interval: interval
      }, {
        timeout: 10000
      })
      
      if (response.data && response.data.data) {
        setCoordinates(response.data.data)
        console.log('API调用成功:', response.data.data.length, '个点')
      }
    } catch (err: any) {
      console.error('API调用失败:', err.message)
      setError('后端未启动，使用本地计算')
      
      // 回退到本地计算
      const localCoords = generateLocalCoords()
      setCoordinates(localCoords)
    }
    
    setLoading(false)
  }

  // 本地生成测试坐标
  const generateLocalCoords = (): Coordinate[] => {
    const coords: Coordinate[] = []
    
    for (let s = startStation; s <= endStation; s += interval) {
      // 简化的坐标计算
      const x = 500000 + s * Math.cos(Math.PI / 4)
      const y = 3000000 + s * Math.sin(Math.PI / 4)
      
      // 纵坡计算
      let z = 100
      if (s <= 500) {
        z = 100 + s * 20 / 1000  // 上升段
      } else if (s <= 700) {
        // 竖曲线段
        const ls = s - 500
        z = 110 + 20 * ls / 1000 - 35 * ls * ls / (200 * 1000)
      } else {
        z = 110 - 15 * (s - 500) / 1000 - 35 * 200 * (s - 500) / (200 * 1000)
      }
      
      coords.push({
        station: `K${Math.floor(s / 1000)}+${(s % 1000).toString().padStart(3, '0')}`,
        x: Math.round(x * 100) / 100,
        y: Math.round(y * 100) / 100,
        z: Math.round(z * 100) / 100,
        azimuth: 45
      })
    }
    
    return coords
  }

  // 页面加载时计算
  useEffect(() => {
    calculateFromAPI()
  }, [])

  return (
    <div className="app">
      <header className="header">
        <h1>🛣️ NeuralSite Studio</h1>
        <p>公路参数化建模可视化系统</p>
      </header>
      
      <main className="main">
        <aside className="sidebar">
          <ParameterPanel 
            params={params}
            setParams={setParams}
            startStation={startStation}
            setStartStation={setStartStation}
            endStation={endStation}
            setEndStation={setEndStation}
            interval={interval}
            setInterval={setInterval}
            onCalculate={calculateFromAPI}
            loading={loading}
          />
        </aside>
        
        <section className="content">
          {error && (
            <div style={{
              position: 'absolute',
              top: 10,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(255, 100, 100, 0.9)',
              padding: '8px 16px',
              borderRadius: 6,
              zIndex: 100,
              fontSize: 12
            }}>
              {error} - 正在使用本地计算
            </div>
          )}
          <RoadViewer coordinates={coordinates} loading={loading} />
        </section>
      </main>
    </div>
  )
}

export default App
