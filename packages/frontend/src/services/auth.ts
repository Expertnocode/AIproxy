import { User, AuthResponse, LoginRequest, CreateUserRequest } from '@aiproxy/shared'
import { apiService } from './api'

class AuthService {
  async login(email: string, password: string): Promise<AuthResponse> {
    const loginData: LoginRequest = { email, password }
    return apiService.post<AuthResponse>('/auth/login', loginData)
  }

  async register(email: string, name: string, password: string): Promise<AuthResponse> {
    const registerData: CreateUserRequest = { email, name, password, role: 'USER' as any }
    return apiService.post<AuthResponse>('/auth/register', registerData)
  }

  async logout(): Promise<void> {
    return apiService.post<void>('/auth/logout')
  }

  async getCurrentUser(): Promise<User> {
    return apiService.get<User>('/auth/me')
  }
}

export const authService = new AuthService()