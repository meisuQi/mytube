import {z} from "zod";
import {toast} from "sonner";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {trpc} from "@/trpc/client";
import {Button} from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ResponsiveModal } from "@/components/responsive-dialog";
import{
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";


 interface PlaylistCreateModalProps{
  open:boolean; // 控制模态框显示/隐藏
  onOpenChange:(open:boolean)=>void;// 状态变更回调
 };
//表单验证模式
 const formSchema=z.object({
  name:z.string().min(1),//要求名称至少1个字符
 });

 export const PlaylistCreateModal=({
  open,
  onOpenChange,
 }:PlaylistCreateModalProps)=>{
  //表单初始化
  const form=useForm<z.infer<typeof formSchema>>({
    resolver:zodResolver(formSchema),// 集成Zod验证
    defaultValues:{ // 初始值
      name:""
    }
  });
  //API 调用配置
  const utils=trpc.useUtils();
  const create=trpc.playlists.create.useMutation({
    onSuccess:()=>{
      utils.playlists.getMany.invalidate();
      toast.success("Playlist created");
      form.reset();//重置表单
      onOpenChange(false);// 关闭模态框
    },
    onError:()=>{
      toast.error("Something went wrong")
    }
  });
  //提交处理函数。参数 values 就是表单中所有字段的当前值，自动根据你定义的 schema（formSchema）生成。
  const onSubmit=(values:z.infer<typeof formSchema>)=>{
    create.mutate(values)//// 调用tRPC mutation，发起请求
  };
  //UI渲染
  return (
    <ResponsiveModal
      title="Create a playlist"
      open={open}
      onOpenChange={onOpenChange}
    >
    {/* form 是通过 useForm() 初始化得到的，里面包含所有表单状态和方法。
      <Form {...form}> 会把这些状态提供给子组件（如 FormField、FormItem 等），方便嵌套使用。 */}
     <Form {...form}>
      <form 
      // 这里的 form.handleSubmit(onSubmit) 会自动：
      /* 监听 <form> 的提交事件；
        调用你传入的 onSubmit(values) 函数；
        参数 values 就是表单中所有字段的当前值，自动根据你定义的 schema（formSchema）生成。
        换句话说，用户一点击提交按钮，react-hook-form 会读取当前所有输入框的值，校验后打包成一个对象作为 values 传入你写的 onSubmit 函数。 */
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
      >
        <FormField
          control={form.control}
          name="name"
          //render={({field}) => ...}	渲染函数，field 包含所有绑定逻辑（例如 onChange、value）
          /* render 接收一个对象 { field }，这个 field 实际上是一个对象，包含：
            {
              name: 'name',
              value: 当前这个字段的值,
              onChange: (e) => 更新这个字段的值,
              onBlur: ...
              ref: ...
            } */
          render={({field})=>(
            <FormItem>
              <FormLabel>Prompt</FormLabel>
              {/* 这是一个封装了样式的容器，用来放实际的输入组件。 */}
              <FormControl>
                <Input
                /* ...field 让这个 <Input> 成为受控组件，自动联动 react-hook-form 的状态管理。这样就不需要手动写 onChange 或 value。 */
                  {...field}
                   placeholder="My favorite videos"  
                />
              </FormControl>
            </FormItem>
          )}
        />
        <div className="flex justify-end">
           <Button
            disabled={create.isPending}
            type="submit"
           >
            Create   
            </Button> 
        </div>
      </form>
     </Form>
    </ResponsiveModal>
  );
};

 