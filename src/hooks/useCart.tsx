import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }
    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const searchProduct = cart.find((product) => product.id === productId)

      if(searchProduct){
        return updateProductAmount({
          productId: productId,
          amount: searchProduct.amount + 1
        })

      }

      const response = await api.get(`/products/${productId}`)
      const responseData = response.data

      const product:Product = {...responseData, amount: 1}

      const productsList = [...cart, product]
      productsList.sort((a,b) => (a.id > b.id) ? 1 : ((b.id > a.id) ? -1 : 0))

      setCart(productsList)

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(productsList))

    } catch {
      toast.error('Erro na adição do produto')
    }
  }

  const removeProduct = (productId: number) => {
    try {
      const searchProduct = cart.find((product) => product.id === productId)

      if(searchProduct){

        const productsList = [...cart.filter(productCard => productCard.id !== productId)]

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(productsList))

        return setCart([
          ...cart.filter(productCard => productCard.id !== productId)
        ])
      } else {
        throw new Error()
      }
    } catch {
      toast.error('Erro na remoção do produto')
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {

      const response = await api.get(`/stock/${productId}`)
      const responseData:Stock = response.data

      const searchProductCart = cart.find((product) => product.id === productId) 

      if(searchProductCart){

        if(amount > responseData.amount){
          toast.error('Quantidade solicitada fora de estoque')
        } else if (amount === 0){ 
          return;
        } else {
          searchProductCart.amount = amount
          const productsList = [...cart.filter(productCard => productCard.id !== productId), searchProductCart]
          productsList.sort((a,b) => (a.id > b.id) ? 1 : ((b.id > a.id) ? -1 : 0))

          localStorage.setItem('@RocketShoes:cart', JSON.stringify(productsList))

          return setCart(
            productsList
          )
        }
        
      }
      
    } catch {
      toast.error('Erro na alteração de quantidade do produto')
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
