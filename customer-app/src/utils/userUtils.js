// Utility functions for handling user data across different login structures

// Get current user from localStorage
export const getCurrentUser = () => {
  const userData = localStorage.getItem('user')
  return userData ? JSON.parse(userData) : null
}

// Extract user ID from different user data structures
export const getUserId = (userData) => {
  if (!userData) {
    console.log('getUserId: No user data provided')
    return null
  }
  
  console.log('getUserId: User data structure:', userData)
  
  // Handle customer login structure: { token, customer: { _id, ... } }
  if (userData.customer && userData.customer._id) {
    console.log('getUserId: Found customer ID:', userData.customer._id)
    return userData.customer._id
  }
  
  // Handle user login structure: { token, user: { _id, ... } }
  if (userData.user && userData.user._id) {
    console.log('getUserId: Found user ID:', userData.user._id)
    return userData.user._id
  }
  
  // Handle direct user structure: { _id, ... }
  if (userData._id) {
    console.log('getUserId: Found direct _id:', userData._id)
    return userData._id
  }
  
  // Handle alternative ID field
  if (userData.id) {
    console.log('getUserId: Found alternative id:', userData.id)
    return userData.id
  }
  
  console.log('getUserId: No valid user ID found in user data')
  return null
}

// Extract user object from different user data structures
export const getUserObject = (userData) => {
  if (!userData) return null
  
  // Handle customer login structure: { token, customer: { _id, ... } }
  if (userData.customer) {
    return userData.customer
  }
  
  // Handle user login structure: { token, user: { _id, ... } }
  if (userData.user) {
    return userData.user
  }
  
  // Handle direct user structure: { _id, ... }
  return userData
}

// Check if profile is complete
export const isProfileComplete = (userData) => {
  if (!userData) return false
  
  const user = getUserObject(userData)
  // Trust persisted backend-computed flag if present
  if (user && user.profileComplete === true) return true

  return user.name && user.phone && 
    user.address?.street && user.address?.city && 
    user.address?.state && user.address?.pincode
}
