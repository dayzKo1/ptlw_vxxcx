/**
 * 地址服务云函数
 * 整合：getAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress
 */

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
  const { action } = event

  switch (action) {
    case 'list': return await getAddressList(event, context)
    case 'add': return await addAddress(event, context)
    case 'update': return await updateAddress(event, context)
    case 'delete': return await deleteAddress(event, context)
    case 'setDefault': return await setDefaultAddress(event, context)
    default: return { success: false, message: '未知操作' }
  }
}

// 获取地址列表
async function getAddressList(event, context) {
  const wxContext = cloud.getWXContext()

  try {
    const res = await db.collection('addresses')
      .where({ _openid: wxContext.OPENID })
      .orderBy('isDefault', 'desc')
      .orderBy('createTime', 'desc')
      .get()

    return { success: true, data: res.data }
  } catch (err) {
    return { success: false, message: '获取失败' }
  }
}

// 添加地址
async function addAddress(event, context) {
  const wxContext = cloud.getWXContext()
  const { name, phone, province, city, district, detail, isDefault } = event

  try {
    // 如果设为默认，取消其他默认
    if (isDefault) {
      await db.collection('addresses')
        .where({ _openid: wxContext.OPENID, isDefault: true })
        .update({ data: { isDefault: false } })
    }

    const res = await db.collection('addresses').add({
      data: {
        _openid: wxContext.OPENID,
        name, phone, province, city, district, detail,
        isDefault: isDefault || false,
        createTime: Date.now()
      }
    })

    return { success: true, data: { _id: res._id } }
  } catch (err) {
    return { success: false, message: '添加失败' }
  }
}

// 更新地址
async function updateAddress(event, context) {
  const wxContext = cloud.getWXContext()
  const { addressId, name, phone, province, city, district, detail, isDefault } = event

  try {
    // 验证地址所有权
    const addrRes = await db.collection('addresses').doc(addressId).get()
    if (!addrRes.data || addrRes.data._openid !== wxContext.OPENID) {
      return { success: false, message: '无权限修改此地址' }
    }

    if (isDefault) {
      await db.collection('addresses')
        .where({ _openid: wxContext.OPENID, isDefault: true })
        .update({ data: { isDefault: false } })
    }

    await db.collection('addresses').doc(addressId).update({
      data: { name, phone, province, city, district, detail, isDefault }
    })

    return { success: true }
  } catch (err) {
    return { success: false, message: '更新失败' }
  }
}

// 删除地址
async function deleteAddress(event, context) {
  const wxContext = cloud.getWXContext()
  const { addressId } = event

  try {
    // 验证地址所有权
    const addrRes = await db.collection('addresses').doc(addressId).get()
    if (!addrRes.data || addrRes.data._openid !== wxContext.OPENID) {
      return { success: false, message: '无权限删除此地址' }
    }

    await db.collection('addresses').doc(addressId).remove()
    return { success: true }
  } catch (err) {
    return { success: false, message: '删除失败' }
  }
}

// 设置默认地址
async function setDefaultAddress(event, context) {
  const wxContext = cloud.getWXContext()
  const { addressId } = event

  try {
    // 验证地址所有权
    const addrRes = await db.collection('addresses').doc(addressId).get()
    if (!addrRes.data || addrRes.data._openid !== wxContext.OPENID) {
      return { success: false, message: '无权限设置此地址' }
    }

    await db.collection('addresses')
      .where({ _openid: wxContext.OPENID, isDefault: true })
      .update({ data: { isDefault: false } })

    await db.collection('addresses').doc(addressId).update({
      data: { isDefault: true }
    })

    return { success: true }
  } catch (err) {
    return { success: false, message: '设置失败' }
  }
}