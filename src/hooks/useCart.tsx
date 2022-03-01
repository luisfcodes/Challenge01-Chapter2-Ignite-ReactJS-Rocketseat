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

  localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart))

  const addProduct = async (productId: number) => {
    try {
      const searchProduct = cart.find((product) => product.id === productId)

      if(searchProduct){

        return updateProductAmount({
          productId: productId,
          amount: searchProduct.amount + 1
        })

      }

      const response = await api.get('/products')
      const responseData = await response.data

      const productSelected = responseData.find((product: Product) => product.id === productId)

      setCart([...cart, {...productSelected, amount: 1}])
      
    } catch {
      toast.error('Erro na adição do produto')
    }
  }

  const removeProduct = (productId: number) => {
    try {
      const searchProduct = cart.find((product) => product.id === productId)

      if(searchProduct){
        return setCart([
          ...cart.filter(productCard => productCard.id !== productId)
        ])
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

      const response = await api.get('/stock')
      const responseData = await response.data

      const searchProductStock = responseData.find((product: Stock) => product.id === productId)

      const searchProductCart = cart.find((product) => product.id === productId) 

      if(searchProductCart){

        if(amount > searchProductStock.amount){
          toast.error('Quantidade solicitada fora de estoque')
        } else {
          searchProductCart.amount = amount

          return setCart([
            ...cart.filter(productCard => productCard.id !== productId), searchProductCart
          ])
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
