import type { LoaderFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { json, redirect } from "@remix-run/node";
import { getAccessTokenFromCookies } from "~/server/sessionCookieHelper.server";
import { getPostgresDatabaseManager } from "~/common--database-manager--postgres/postgresDatabaseManager.server";
import { Link } from "react-router-dom";
import Cart from "~/Components/cart";

type Product = {
	name: number;
	price: string;
	imageUrl: string;
};

export const loader: LoaderFunction = async ({ request, params }) => {
	try {
		const accessToken = await getAccessTokenFromCookies(request);

		if (accessToken == null) {
			return redirect("/sign-in");
		} else {
			console.log("accessToken hai");
		}

		if (!accessToken.email.endsWith("@growthjockey.com")) {
			throw new Error("Unauthorized access");
		}
		const productId = params.id;
		// Fetch categories from the database
		const postgresDatabaseManager = await getPostgresDatabaseManager(null);
		if (postgresDatabaseManager instanceof Error) {
			throw new Error("Error connecting to database");
		}

		const result = await postgresDatabaseManager.execute(
			`SELECT 
             name,price,image_url,description,id
        FROM
             products
        WHERE
              id = $1`,
			[productId]
		);

		if (result instanceof Error) {
			throw new Error("Error querying database for products");
		}

		const userEmail = accessToken.email;

		const products: Product[] = result.rows;

		return json({ products, userEmail });
	} catch (error) {
		console.error(error);
		return json({ error: "Failed to load products" }, 500);
	}
};

export default function SearchProductsById() {
	const data = useLoaderData();
    console.log(data.userEmail);
    const handleAddToCart = async (email:string, productId:number) => {
        console.log(email);
        console.log(productId);
        try {
            await fetch("/addProduct", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, product_id: productId }),
            });

			window.location.reload();
        } catch (error) {
            console.error("Failed to increase product:", error);
        }
    };

	return (
		<div className="bg-gradient-to-br from-orange-200 to-orange-300 min-h-screen">
			<header className="flex justify-center bg-orange-50 text-white py-4">
				<Link to={`/`}>
					<img
						src="https://sleepyhug.in/cdn/shop/files/Group_1831.png?v=1690469218&width=140"
						className=""
						alt="Logo"
					/>
				</Link>
				<Cart />
			</header>

			<main className="container mx-auto py-4">
				<div className="bg-white rounded-lg shadow-md p-4 flex items-center">
					{/* Left side (Image) */}
					<div>
						<img
							src={data.products[0].image_url}
							alt={data.products[0].name}
							className="mx-auto mb-2 h-64 w-64"
						/>
					</div>

					<div className="ml-4 h-64 flex flex-col justify-between">
                        <div>
                            <h2 className="text-xl font-semibold mb-2">
                                {data.products[0].name}
                            </h2>
                        </div>
                        <p className="text-sm text-gray-600 mb-2 w-96">
                            {data.products[0].description}
                        </p>
                        <div>
                            <h2 className="text-xl font-semibold">
                                {data.products[0].price}
                            </h2>
                        </div>
                        <div>
                            <button
                                onClick={() =>
                                    handleAddToCart(
                                        data.userEmail,
                                        data.products[0].id
                                    )
                                }
                                className="border  p-1 px-2 rounded text-black"
                            >
                                Add to cart
                            </button>
                        </div>
                    </div>
				</div>
			</main>
		</div>
	);
}
