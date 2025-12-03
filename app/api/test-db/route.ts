import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const results: string[] = []
    
    // Check environment variables first
    results.push('0️⃣ 检查环境变量...')
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl) {
      return NextResponse.json({
        success: false,
        error: '缺少环境变量 NEXT_PUBLIC_SUPABASE_URL',
        hint: '请在 .env.local 文件中配置 Supabase URL',
        results: results.join('\n')
      }, { status: 500 })
    }
    
    if (!supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        error: '缺少环境变量 SUPABASE_SERVICE_ROLE_KEY',
        hint: '请在 .env.local 文件中配置 Supabase Service Role Key',
        results: results.join('\n')
      }, { status: 500 })
    }
    
    // Validate URL format
    if (!supabaseUrl.startsWith('https://')) {
      return NextResponse.json({
        success: false,
        error: `Supabase URL 格式错误: ${supabaseUrl}`,
        hint: 'URL 应该以 https:// 开头，例如: https://xxxxx.supabase.co',
        results: results.join('\n')
      }, { status: 500 })
    }
    
    results.push(`✅ Supabase URL: ${supabaseUrl.substring(0, 30)}...`)
    results.push(`✅ Service Key: ${supabaseServiceKey.substring(0, 20)}...`)
    results.push('\n')
    
    // Import supabase after validation
    const { supabaseAdmin } = await import('@/lib/supabase')
    
    // Test 1: Check connection
    results.push('1️⃣ 测试数据库连接...')
    const { error: connectionError } = await supabaseAdmin
      .from('stories')
      .select('count')
      .limit(1)
    
    if (connectionError) {
      if (connectionError.code === 'PGRST116') {
        // Table doesn't exist, that's okay
        results.push('⚠️  表不存在（这是正常的，需要先创建表）\n')
      } else if (connectionError.message?.includes('404') || connectionError.message?.includes('Not Found')) {
        return NextResponse.json({
          success: false,
          error: 'Supabase 404 错误',
          details: connectionError.message,
          hint: '请检查：\n1. Supabase URL 是否正确（格式：https://xxxxx.supabase.co）\n2. 项目是否已创建\n3. 网络连接是否正常',
          code: connectionError.code,
          results: results.join('\n')
        }, { status: 500 })
      } else {
        throw connectionError
      }
    } else {
      results.push('✅ 数据库连接成功\n')
    }

    // Test 2: Check if table exists
    results.push('2️⃣ 检查表是否存在...')
    const { data: stories, error: selectError } = await supabaseAdmin
      .from('stories')
      .select('*')
      .limit(1)

    if (selectError) {
      if (selectError.code === 'PGRST116') {
        results.push('❌ 表不存在')
        results.push('\n📝 请按照以下步骤创建表:')
        results.push('1. 访问 Supabase Dashboard')
        results.push('2. 进入 SQL Editor')
        results.push('3. 执行 supabase/schema.sql 中的 SQL 语句')
        results.push('\n或者直接访问: https://supabase.com/dashboard/project/_/sql')
      } else {
        throw selectError
      }
    } else {
      results.push('✅ 表已存在\n')
      
      // Test 3: Test insert
      results.push('3️⃣ 测试插入数据...')
      const testStory = {
        words: '测试',
        content: '这是一个测试故事，用于验证数据库功能是否正常。',
        likes: 0
      }

      const { data: inserted, error: insertError } = await supabaseAdmin
        .from('stories')
        .insert(testStory)
        .select()
        .single()

      if (insertError) {
        throw insertError
      }

      results.push('✅ 数据插入成功')
      results.push(`   插入的数据 ID: ${inserted.id}`)
      results.push(`   字数: ${inserted.words}`)
      results.push('\n')

      // Test 4: Test query
      results.push('4️⃣ 测试查询数据...')
      const { data: queried, error: queryError } = await supabaseAdmin
        .from('stories')
        .select('*')
        .eq('id', inserted.id)
        .single()

      if (queryError) {
        throw queryError
      }

      results.push('✅ 数据查询成功')
      results.push(`   查询到的故事: ${queried.content.substring(0, 50)}...`)
      results.push('\n')

      // Test 5: Test update (like)
      results.push('5️⃣ 测试更新数据（点赞）...')
      const { data: updated, error: updateError } = await supabaseAdmin
        .from('stories')
        .update({ likes: 1 })
        .eq('id', inserted.id)
        .select()
        .single()

      if (updateError) {
        throw updateError
      }

      results.push('✅ 数据更新成功')
      results.push(`   点赞数: ${updated.likes}`)
      results.push('\n')

      // Test 6: Clean up test data
      results.push('6️⃣ 清理测试数据...')
      const { error: deleteError } = await supabaseAdmin
        .from('stories')
        .delete()
        .eq('id', inserted.id)

      if (deleteError) {
        results.push('⚠️  清理测试数据失败: ' + deleteError.message)
      } else {
        results.push('✅ 测试数据已清理')
      }
    }

    return NextResponse.json({
      success: true,
      message: '数据库测试完成',
      results: results.join('\n')
    }, { status: 200 })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    }, { status: 500 })
  }
}

