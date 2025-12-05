import { getDeviceId, resetDeviceId } from '@/lib/deviceId'

// Mock localStorage and sessionStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}

const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
})

describe('getDeviceId', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
    sessionStorageMock.getItem.mockReturnValue(null)
  })

  it('should return existing device ID from localStorage', () => {
    localStorageMock.getItem.mockReturnValue('existing-device-id')
    const deviceId = getDeviceId()
    expect(deviceId).toBe('existing-device-id')
    expect(localStorageMock.getItem).toHaveBeenCalledWith('device_user_id')
  })

  it('should generate new device ID when not in localStorage', () => {
    localStorageMock.getItem.mockReturnValue(null)
    localStorageMock.setItem.mockImplementation(() => {})
    
    const deviceId = getDeviceId()
    
    expect(deviceId).toMatch(/^device_/)
    expect(localStorageMock.setItem).toHaveBeenCalled()
  })

  it('should fallback to sessionStorage when localStorage fails', () => {
    localStorageMock.getItem.mockImplementation(() => {
      throw new Error('localStorage not available')
    })
    sessionStorageMock.getItem.mockReturnValue(null)
    sessionStorageMock.setItem.mockImplementation(() => {})
    
    const deviceId = getDeviceId()
    
    expect(deviceId).toMatch(/^device_/)
    expect(sessionStorageMock.setItem).toHaveBeenCalled()
  })

  it('should return temp ID when both storages fail', () => {
    localStorageMock.getItem.mockImplementation(() => {
      throw new Error('localStorage not available')
    })
    sessionStorageMock.getItem.mockImplementation(() => {
      throw new Error('sessionStorage not available')
    })
    
    const deviceId = getDeviceId()
    
    expect(deviceId).toMatch(/^temp_/)
  })
})

describe('resetDeviceId', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should remove device ID from both storages and generate new one', () => {
    localStorageMock.getItem.mockReturnValue(null)
    localStorageMock.setItem.mockImplementation(() => {})
    
    const newDeviceId = resetDeviceId()
    
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('device_user_id')
    expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('device_user_id')
    expect(newDeviceId).toMatch(/^device_/)
  })
})




