import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'genetrust_nipt_secret_key_2026';

export async function GET(req) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ valid: false, error: 'Chưa cung cấp token xác thực' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    return NextResponse.json({
      valid: true,
      user: decoded
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return NextResponse.json({ valid: false, error: 'Token đã hết hạn' }, { status: 401 });
    }
    return NextResponse.json({ valid: false, error: 'Token không hợp lệ' }, { status: 401 });
  }
}
