import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import { fallbackStore } from '@/lib/store-fallback';

export async function GET(req) {
  try {
    const db = await connectToDatabase();
    if (db) {
      const users = await User.find({}).select('-password').sort({ createdAt: -1 });
      return NextResponse.json(users);
    }
    const cleanUsers = fallbackStore.users.map(({ passwordHash, ...u }) => u);
    return NextResponse.json(cleanUsers);
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi tải danh sách người dùng' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { username, password, fullName, email, role } = await req.json();

    if (!username || !password || !fullName) {
      return NextResponse.json({ error: 'Vui lòng điền đầy đủ Tên đăng nhập, Mật khẩu và Họ tên' }, { status: 400 });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const db = await connectToDatabase();
    if (db) {
      const existing = await User.findOne({ username });
      if (existing) {
        return NextResponse.json({ error: 'Tên đăng nhập đã tồn tại' }, { status: 400 });
      }
      const newUser = await User.create({
        username,
        password: hashedPassword,
        fullName,
        email: email || '',
        role: role || 'staff'
      });
      return NextResponse.json({ message: 'Tạo tài khoản thành công', user: newUser });
    }

    // Fallback store insert
    const exists = fallbackStore.users.find(u => u.username === username);
    if (exists) {
      return NextResponse.json({ error: 'Tên đăng nhập đã tồn tại' }, { status: 400 });
    }

    const newFbUser = {
      id: 'usr_' + Date.now(),
      username,
      passwordHash: hashedPassword,
      fullName,
      email: email || '',
      role: role || 'staff',
      createdAt: new Date().toISOString()
    };
    fallbackStore.users.push(newFbUser);

    const { passwordHash, ...userClean } = newFbUser;
    return NextResponse.json({ message: 'Tạo tài khoản thành công (Local)', user: userClean });

  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json({ error: 'Không thể tạo tài khoản mới' }, { status: 500 });
  }
}
