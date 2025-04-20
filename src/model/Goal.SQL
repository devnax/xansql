SELECT u.name, JSON_ARRAYAGG(
        JSON_OBJECT(
            'id', um.id, 'user', JSON_OBJECT(
                'id', u1.id, 'name', u1.name, 'products', JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'id', p.id, 'name', p.name, 'user', JSON_OBJECT(
                            'id', u2.id, 'name', u2.name, 'email', u2.email, 'password', u2.password, 'created_at', u2.created_at, 'updated_at', u2.updated_at
                        ), 'categorys', JSON_ARRAYAGG(
                            JSON_OBJECT('id', c.id, 'name', c.name)
                        )
                    )
                )
            )
        )
    ) AS metas
FROM
    users u
    JOIN user_metas um ON um.user_id = u.id
    JOIN users u1 ON u1.id = um.user_id
    JOIN products p ON p.user_id = u.id
    JOIN users u2 ON u2.id = p.user_id
    JOIN categories c ON c.id = pc.category_id
WHERE
    u.status = 'active' AND EXISTS(
        SELECT 1
        FROM user_metas um2
        WHERE um2.user_id = u.id AND um2.status = 'active'
    )
GROUP BY
    u.id, u.name;

SELECT 1 FROM users 
JOIN user_metas um ON um.user_id = u.id
JOIN products p ON p.user_id = u.id
WHERE u.name="hello"
LIMIT 1;


SELECT 1
FROM users u
WHERE
    u.name = 'hello'
    AND EXISTS (
        SELECT 1
        FROM user_metas um
        WHERE
            um.user_id = u.id
            AND um.status = 'active'
    )
    AND EXISTS (
        SELECT 1
        FROM products p
        WHERE
            p.user_id = u.id
            AND p.status = 'active'
    )
LIMIT 1;


SELECT u.name, (
        SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'id', um.id, 'user', JSON_OBJECT('id', u1.id, 'name', u1.name)
                )
            )
        FROM user_metas um
            JOIN users u1 ON u1.id = um.user_id
        WHERE
            um.user_id = u.id
        LIMIT 10 -- Applying the LIMIT directly in the subquery for metas
    ) AS metas, (
        SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'id', p.id, 'name', p.name, 'user', JSON_OBJECT('id', u2.id, 'name', u2.name)
                )
            )
        FROM products p
            JOIN users u2 ON u2.id = p.user_id
        WHERE
            p.user_id = u.id
        LIMIT 10 -- Applying the LIMIT directly in the subquery for products
    ) AS products
FROM users u
WHERE
    u.status = 'active'
    AND EXISTS (
        SELECT 1
        FROM user_metas um
        WHERE
            um.user_id = u.id
            AND um.status = 'active'
    )
    AND EXISTS (
        SELECT 1
        FROM products p
        WHERE
            p.user_id = u.id
            AND p.status = 'active'
    );





SELECT u.name, JSON_ARRAYAGG(
        JSON_OBJECT(
            'id', um.id, 'user', JSON_OBJECT(
                'id', u1.id, 'name', u1.name, 'products', (
                    SELECT JSON_ARRAYAGG(
                            JSON_OBJECT(
                                'id', p.id, 'name', p.name, 'user', JSON_OBJECT(
                                    'id', u2.id, 'name', u2.name, 'email', u2.email, 'password', u2.password, 'created_at', u2.created_at, 'updated_at', u2.updated_at
                                ), 'categorys', (
                                    SELECT JSON_ARRAYAGG(
                                            JSON_OBJECT('id', c.id, 'name', c.name)
                                        )
                                    FROM categories c
                                    WHERE
                                        c.product_id = p.id
                                    LIMIT 3
                                )
                            )
                        )
                    FROM products p
                        JOIN users u2 ON u2.id = p.user_id
                    WHERE
                        p.user_id = u1.id
                    LIMIT 5
                )
            )
        )
    ) AS metas
FROM
    users u
    JOIN user_metas um ON um.user_id = u.id
    JOIN users u1 ON um.user_id = u1.id
GROUP BY
    u.id,
    u.name
LIMIT 10;
-- Here, you can limit the total number of users.






SELECT
    COUNT(DISTINCT u.id) AS users,
    COUNT(DISTINCT um.id) AS user_metas,
    COUNT(DISTINCT p.id) AS products,
    COUNT(DISTINCT c.id) AS categories
FROM
    users u
    LEFT JOIN user_metas um ON um.user_id = u.id
    LEFT JOIN products p ON p.user_id = u.id
    LEFT JOIN categories c ON c.product_id = p.id
