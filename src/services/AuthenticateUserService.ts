import axios from 'axios';
import { sign } from 'jsonwebtoken';
import prismaClient from '../prisma';

interface IAcessTokenResponse {
  access_token: string;
}

interface IUserResponse {
  id: number;
  name: string;
  avatar_url: string;
  login: string;
}

class AuthenticateUserService {
  async execute(code: string) {
    const url = "https://github.com/login/oauth/access_token";

    const {data: acessTokenResponse } = await axios.post<IAcessTokenResponse>(url, null, {
      params: {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      },
      headers: {
        accept: "application/json",
      },
    });

    const response = await axios.get<IUserResponse>("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${acessTokenResponse.access_token}`,
      },
    });
    
    const { login, id, avatar_url, name } = response.data;

    let user = await prismaClient.user.findFirst({
      where: {
        github_id: id,
      },
    });

    if (!user) {
      user = await prismaClient.user.create({
        data: {
          github_id: id,
          login,
          avatar_url,
          name,
        },
      });
    }

    const token = sign(
      {
        user: {
          name: user.name,
          avatar_url: user.avatar_url,
          id: user.id,
        },
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
        subject: user.id,
      }
    )

    return { token, user };
  }
}

export { AuthenticateUserService };