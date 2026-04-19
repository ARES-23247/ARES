SELECT u.id, u.name, u.email, u.image, u.role, u.createdAt, p.first_name, p.last_name, p.nickname, p.member_type FROM user u LEFT JOIN user_profiles p ON u.id = p.user_id ORDER BY u.createdAt DESC;
