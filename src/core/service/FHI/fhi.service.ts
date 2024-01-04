import { Injectable } from '@nestjs/common';
import axios, { AxiosRequestConfig } from 'axios';
import * as dotenv from 'dotenv';
import * as https from 'https';

dotenv.config();

@Injectable()
export class FHIService {
  private async generateToken(employeeId: string): Promise<string> {
    try {
      // FHI generate token for authorization
      const { data: response } = await axios.get(
        `${process.env.FHI_BASE_URL}user/${process.env.FHI_CLIENT_CODE}/${employeeId}/token/${process.env.FHI_KEY_TOKEN}`,
        { httpsAgent: new https.Agent({ rejectUnauthorized: false }) }
      );

      const { data } = response;
      return data?.access_token;
    } catch (error) {
      throw error;
    }
  }

  async apiRequest(
    url: string,
    method: 'GET' | 'POST',
    employeeId: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<any> {
    const token = await this.generateToken(employeeId);

    // Include the token in the request headers
    const headers = {
      Authorization: `Bearer ${token}`,
      ...(config?.headers || {})
    };

    try {
      const response = await axios({
        method,
        url: `${process.env.FHI_BASE_URL}${url}`,
        data,
        headers,
        ...config,
        httpsAgent: new https.Agent({ rejectUnauthorized: false })
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  }
}
