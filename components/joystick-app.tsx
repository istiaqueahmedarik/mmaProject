'use client'

import { useState, useEffect, useCallback } from 'react'
import { Joystick } from 'react-joystick-component'
import type { IJoystickUpdateEvent } from 'react-joystick-component'

export function JoystickAppComponent() {
  const [direction, setDirection] = useState<string>('None')
  const [leftMotor, setLeftMotor] = useState<number>(1500)
  const [rightMotor, setRightMotor] = useState<number>(1500)
  const [joystickState, setJoystickState] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [hapticFeedback, setHapticFeedback] = useState<string>('No Feedback')

  const vibrate = useCallback((duration: number) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(duration)
      setHapticFeedback('Vibrating')
    } else {
      setHapticFeedback('Vibration not supported')
    }
  }, [])

  const handleMove = useCallback((event: IJoystickUpdateEvent) => {
    if (event.type === 'move') {
      setJoystickState({ x: event.x || 0, y: event.y || 0 })
    } else if (event.type === 'stop') {
      setJoystickState({ x: 0, y: 0 })
      setHapticFeedback('No Feedback')
    }
  }, [])

  const [ws, setWs] = useState<WebSocket | null>(null); // WebSocket instance
  const [connected, setConnected] = useState<boolean>(false);
  // Connect to WebSocket server when component mounts
  useEffect(() => {
    const websocket = new WebSocket('ws://192.168.0.184/ws'); // Replace with your ESP32 IP address

    // Event listener for WebSocket connection open
    websocket.onopen = () => {
      // addLog('Connected to WebSocket server');
      console.log('Connected to WebSocket server');
      setConnected(true);
    };

    // Event listener for receiving messages
    websocket.onmessage = (event: MessageEvent) => {
      // addLog(`Received: ${event.data}`);
      console.log(`Received: ${event.data}`);
    };

    // Event listener for WebSocket errors
    websocket.onerror = (event: Event) => {
      // addLog(`Error: ${event}`);
      console.error(`Error: ${event}`);
      setConnected(false);
    };

    // Event listener for WebSocket connection close
    websocket.onclose = () => {
      // addLog('WebSocket connection closed');
      console.log('WebSocket connection closed');
      setConnected(false);
    };

    // Save WebSocket instance in state
    setWs(websocket);

    // Clean up WebSocket connection on unmount
    return () => {
      websocket.close();
    };
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      const { x, y } = joystickState

      // Calculate direction
      let newDirection: string
      if (x === 0 && y === 0) {
        newDirection = 'None'
      } else if (Math.abs(y) > Math.abs(x)) {
        newDirection = y > 0 ? 'Up' : 'Down'
      } else {
        newDirection = x > 0 ? 'Right' : 'Left'
      }
      setDirection(newDirection)

      // Calculate motor speeds
      const forward = y * 500 // Invert y as up is negative
      const turn = x * 500

      let leftSpeed = 1500 + forward + turn
      let rightSpeed = 1500 + forward - turn

      // Clamp values between 1000 and 2000
      leftSpeed = Math.max(1000, Math.min(2000, leftSpeed))
      rightSpeed = Math.max(1000, Math.min(2000, rightSpeed))

      setLeftMotor(Math.round(leftSpeed))
      setRightMotor(Math.round(rightSpeed))

      if (ws && connected) {
        const msg = 0 + ',' + Math.round(leftSpeed).toString() + "," + Math.round(rightSpeed).toString(); //0 means motor control
        ws.send(msg);
      }

      // Haptic feedback for extreme positions
      if (Math.abs(x) > 0.8 || Math.abs(y) > 0.8) {
        vibrate(100) // Short vibration
      } else {
        setHapticFeedback('No Feedback')
      }
    }, 1000 / 30) // 30 FPS

    return () => clearInterval(intervalId)
  }, [joystickState, vibrate, ws, connected])

  return (
    <div className="flex flex-col items-center justify-between h-screen bg-background p-4">
      <div className="text-center mt-8">
        <h2 className="text-2xl font-bold mb-4">Joystick Control (30 FPS with Haptic Feedback)</h2>
        <p className="text-xl">
          Direction: <span className="text-primary-foreground font-semibold">{direction}</span>
        </p>
        <div className="mt-4 space-y-2">
          <p className="text-lg">
            Left Motor: <span className="text-accent font-semibold">{leftMotor}</span>
          </p>
          <p className="text-lg">
            Right Motor: <span className="text-accent font-semibold">{rightMotor}</span>
          </p>

          <p>
            Websocket Status: <span className="text-accent font-semibold">{connected ? 'Connected' : 'Disconnected'}</span>
          </p>
        </div>
      </div>
      <div className="mb-8">
        <Joystick
          size={150}
          baseColor="#ddd"
          stickColor="#666"
          move={handleMove}
          stop={handleMove}
        />
      </div>
    </div>
  )
}

