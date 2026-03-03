import { useState, useEffect } from 'react'
import axios from 'axios'
import RoadViewer from './components/RoadViewer'
import ParameterPanel from './components/ParameterPanel'
import './App.css'

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
  const [startStation, setStartStation] = useState(0)
  const [endStation, setEndStation] = useState(1000)
  const [interval, setInterval] = useState(50)

  const calculate = async () => {
    setLoading(true)
    try {
      const response = await axios.post('http://localhost:8000/api/v1/calculate/range', {
        route_id: params.route_id,
        start: startStation,
        end: endStation,
        interval: interval
      })
      setCoordinates(response.data.data)
    } catch (error) {
      console.error('计算失败:', error)
      // 使用本地计算结果
      const localCoords = generateLocalCoords()
      setCoordinates(localCoords)
    }
    setLoading(false)
  }

  // 本地生成测试坐标
  const generateLocalCoords = (): Coordinate[] => {
    const coords: Coordinate[] = []
    for (let s = startStation; s <= endStation; s += interval) {
      const x = 500000 + s * Math.cos(Math.PI / 4)
      const y = 3000000 + s * Math.sin(Math.PI / 4)
      const z = 100 + s / 50
      coords.push({
        station: `K${s / 1000}+${(s % 1000).toString().padStart(3, '0')}`,
        x: Math.round(x * 100) / 100,
        y: Math.round(y * 100) / 100,
        z: Math.round(z * 100) / 100,
        azimuth: 45
      })
    }
    return coords
  }

  useEffect(() => {
    calculate()
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
            onCalculate={calculate}
            loading={loading}
          />
        </aside>
        
        <section className="content">
          <RoadViewer coordinates={coordinates} />
        </section>
      </main>
    </div>
  )
}

export default App
